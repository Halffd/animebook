var API_URL = "http://127.0.0.1:5000"; // Replace with your API URL

// Enable CORS for all routes
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": true,
};
// Helper function to set CORS headers
function setCorsHeaders(res) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}
var util;
var mod;
var aDict;
var analyze;
var wn = console.warn;
var subtitlesFileContent;

function toggleControls() {
  const video = document.getElementById("ab-video-element");
  const styleId = "hide-video-controls";
  let existingStyle = document.getElementById(styleId);

  if (existingStyle) {
    // Controls are hidden, show them
    existingStyle.remove();
    video.dataset.controlsHidden = "false";
  } else {
    // Controls are visible, hide them
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
        #ab-video-element::-webkit-media-controls {
            display: none !important;
        }
        #ab-video-element::-webkit-media-controls-panel {
            display: none !important;
        }
        #ab-video-element::-webkit-media-controls-enclosure {
            display: none !important;
        }
        #ab-video-element::-moz-media-controls {
            display: none !important;
        }
        `;
    document.head.appendChild(style);
    video.dataset.controlsHidden = "true";
  }
}

// Check if controls are currently hidden
function areControlsHidden() {
  const video = document.getElementById("ab-video-element");
  return video.dataset.controlsHidden === "true";
}

// Hide controls initially
function hideControls() {
  const video = document.getElementById("ab-video-element");
  if (!areControlsHidden()) {
    toggleControls();
  }
}

// Show controls
function showControls() {
  const video = document.getElementById("ab-video-element");
  if (areControlsHidden()) {
    toggleControls();
  }
}
const colorMap = {
  particle: "#ff69b4", // pink
  kanji: "#6969ff", // blue
  kana: "#32ed32", // green
  default: "#ffffff", // white
};

// Function to check if text contains Japanese characters
function isJapanese(text) {
  if (!text) return false;
  return /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(
    text
  );
}

// Function to check if a character is a Japanese particle
function isParticleChar(char) {
  const particles = [
    "は",
    "が",
    "を",
    "に",
    "で",
    "と",
    "へ",
    "も",
    "や",
    "の",
    "から",
    "まで",
    "か",
    "よ",
    "ね",
    "さ",
    "わ",
    "な",
    "ぞ",
    "ぜ",
    "とも",
    "かしら",
    "っけ",
    "の",
    "ん",
    "もの",
    "こと",
    "ばかり",
    "だけ",
    "ほど",
    "くらい",
    "など",
    "やら",
    "か",
    "だの",
    "だに",
    "すら",
    "さえ",
    "でも",
    "こそ",
    "しか",
    "ばかり",
    "まで",
    "ばかり",
    "ほど",
    "くらい",
    "など",
    "やら",
    "か",
    "だの",
    "だに",
    "すら",
    "さえ",
    "でも",
    "こそ",
    "しか",
  ];
  return particles.includes(char);
}

function getWordType(token, surface) {
  if (token) {
    if (token.pos === "助詞") return "particle";
  } else {
    // Fallback for when token is not available.
    if (isParticleChar(surface)) return "particle";
  }

  if (surface && /[\u4e00-\u9faf]/.test(surface)) return "kanji";
  if (surface && /[\u3040-\u309f\u30a0-\u30ff]/.test(surface)) return "kana";

  return "default";
}
function stripRubyTags(html) {
  return html.replace(/<ruby>|<\/ruby>|<rt>.*?<\/rt>/g, "");
}

// Handle file uploads
async function handleFileUpload(files, path = "") {
  const formData = new FormData();
  Array.from(files).forEach((file) => {
    formData.append("files", file);
  });

  if (path) {
    formData.append("path", path);
  }

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

// Handle video file loading
function loadVideoFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const videoUrl = URL.createObjectURL(file);
      resolve({
        url: videoUrl,
        name: file.name,
        type: file.type,
        size: file.size,
      });
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
}

var Utils = {
  parseInputNum: function (num) {
    var value = parseFloat(num);
    return value ? value : 0.0;
  },
  wrapInP: function (text) {
    return "<p>" + text + "</p>";
  },
  inputFocusKeys: [
    "ArrowLeft",
    "ArrowUp",
    "ArrowDown",
    "ArrowRight",
    ".",
    "-",
    "=",
  ],
};
Vue.component("caption-item", {
  props: [
    "caption",
    "customOffsets",
    "isAutoPauseMode",
    "isOffsetMode",
    "currentTime",
  ],
  methods: {
    offsetTooNegative: function (caption) {
      var inputOffset = Utils.parseInputNum(this.customOffsets[caption.id]);
      return caption.minCustomOffset && inputOffset < caption.minCustomOffset;
    },
    onInputKeyDown: function (event) {
      if (Utils.inputFocusKeys.indexOf(event.key) !== -1)
        event.stopPropagation();
    },
    deleteCustomOffset: function (caption) {
      this.customOffsets[caption.id] = null;
      delete this.customOffsets[caption.id];
    },
    captionStyle: function (caption) {
      return (
        "caption button" +
        (caption.isActive ? " active" : "") +
        (this.isAutoPauseMode ? " auto-pause" : "")
      );
    },
    selectCaption: function (caption) {
      this.$emit("select-caption", caption, this.calcCaptionOffset(caption));
    },
    // Only use getSourceName for UI display, not for caption text
    getCaptionText: function (caption) {
      if (!caption) return "";
      return caption.text || "";
    },
    displaySidebarCaption: function (caption) {
      var text = this.getCaptionText(caption);
      return "\n" + text.split("\n").map(Utils.wrapInP).join("");
    },
    displayCaptionOffset: function (caption) {
      var offset = this.calcCaptionOffset(caption);
      return (
        '<span data-pseudo-content="' +
        (offset > 0 ? "+" : "") +
        this.calcCaptionOffset(caption).toFixed(2) +
        "s" +
        '"></span>'
      );
    },
    setCustomOffset: function (caption) {
      this.$emit("set-custom-offset", caption, this.calcCaptionOffset(caption));
    },
    calcCaptionOffset: function (caption) {
      return this.currentTime - caption.endTime;
    },
    newline: function () {
      return "\n";
    },
  },
  template: `
              <span>
                <div v-if="caption.customOffset !== null" :class="'caption-custom-offset' + (offsetTooNegative(caption) ? ' error' : '')">
                  <input 
                    form="novalidatedform" 
                    type="number" 
                    step="0.1" 
                    @keydown="onInputKeyDown"
                    :id="'custom_offset_' + caption.id"
                    class="custom-offset-input" 
                    v-model="customOffsets[caption.id]"></input>
                  <div class="delete-custom-offset unselectable" @click="deleteCustomOffset(caption)">X</div>
                  <div class="custom-offset-too-negative" v-if="offsetTooNegative(caption)">
                    Offset too small. Using minimum offset {{caption.minCustomOffset.toFixed(2)}}s instead.
                  </div>
                </div>
                <span class="caption-parent">
                  <span
                    :class="captionStyle(caption)"
                    :data-caption-id="caption.id"
                    @click="selectCaption(caption)">
                    <span class="caption-text"
                      :id="caption.id"
                      :data-caption-id="caption.id"
                      :data-start="caption.startTime"
                      :data-end="caption.endTime"
                      v-html="displaySidebarCaption(caption)">
                    </span>
                    <span v-if="isOffsetMode" class='caption-time-offset unselectable' v-html="displayCaptionOffset(caption)"></span>
                  </span>
                  <span v-html="newline()"></span>
                  <span v-if="isOffsetMode" class='set-custom-offset-button button unselectable' @click="setCustomOffset(caption)" data-pseudo-content="Only offset this line and lines after">
                    <span v-if="isOffsetMode" class='custom-time-offset' v-html="displayCaptionOffset(caption)"></span>
                  </span>
                  <span v-once :data-caption-id="caption.id" :id="'anki-export-' + caption.id" class="anki-export unselectable">
                    <span :data-caption-id="caption.id" class="export-to-recent">
                      <svg class="plus-icon" viewBox="0 0 11 14">
                        <use href="#plus-svg"/>
                      </svg>
                    </span>
                    <span class="export-spinner">
                      <svg class="spinner-icon" viewBox="0 0 1792 1792">
                        <use href="#spinner-svg"/>
                      </svg>
                    </span>
                    <span class="export-success">
                      <svg class="success-icon" viewBox="0 0 1792 1792">
                        <use href="#success-svg"/>
                      </svg>
                    </span>
                    <span class="export-alert">
                      <svg class="alert-icon" viewBox="0 0 1792 1792">
                        <use href="#alert-svg"/>
                      </svg>
                    </span>
                  </span>
                </span>
              </span>
              `,
});

Vue.component("caption-bar", {
  props: [
    "captions",
    "captionSources",
    "activeCaptionSource",
    "customOffsets",
    "isAutoPauseMode",
    "isOffsetMode",
    "currentTime",
  ],
  methods: {
    selectCaption: function (caption, offset) {
      this.$emit("select-caption", caption, offset);
    },
    setCustomOffset: function (caption, offset) {
      this.$emit("set-custom-offset", caption, offset);
    },
    switchSource: function (sourceId) {
      console.log("Switching to source:", sourceId);
      this.$emit("switch-source", sourceId);
    },
    getSourceName: function (sourceId) {
      // Extract a readable name from the source ID
      // Remove file extension and path
      var name = sourceId;
      if (name.includes("/")) {
        name = name.split("/").pop();
      }
      if (name.includes("\\")) {
        name = name.split("\\").pop();
      }
      // Remove file extension
      if (name.lastIndexOf(".") > 0) {
        name = name.substring(0, name.lastIndexOf("."));
      }
      return name;
    },
  },
  data: function () {
    return {
      bufferTime: 0,
    };
  },
  created: function () {
    var self = this;
    self.$watch(
      function () {
        return { t: self.currentTime, i: self.isOffsetMode };
      },
      function () {
        if (self.isOffsetMode) {
          self.bufferTime = self.currentTime;
        }
      },
      { immediate: true }
    );
  },
  template: `
        <div id="sidebar-captions" class="sidebar-captions">
          <style>
            .subtitle-tabs {
              display: flex;
              background-color: var(--bw-150);
              border-bottom: 1px solid var(--bw-300);
              overflow-x: auto;
              white-space: nowrap;
            }
            
            .subtitle-tab {
              padding: 8px 16px;
              cursor: pointer;
              color: var(--tab-fg-color);
              background-color: var(--tab-bg-color);
              transition: background-color 0.2s, color 0.2s;
              border-right: 1px solid var(--bw-200);
              user-select: none;
            }
            
            .subtitle-tab:hover {
              background-color: var(--tab-hover-bg-color);
              color: var(--tab-hover-fg-color);
            }
            
            .subtitle-tab.active {
              background-color: var(--tab-active-bg-color);
              color: var(--tab-active-fg-color);
              font-weight: bold;
            }
          </style>
          <div class="subtitle-tabs" v-if="captionSources.length > 1">
            <div 
              v-for="sourceId in captionSources" 
              :key="sourceId"
              :class="['subtitle-tab', {'active': sourceId === activeCaptionSource}]"
              @click="switchSource(sourceId)"
            >
              {{ getSourceName(sourceId) }}
            </div>
          </div>
          <div class="captions-container">
            <div class="captions-list" lang="ja">
              <!-- Display captions from the active source -->
              <template v-if="captions[activeCaptionSource]">
                <span v-for="caption in captions[activeCaptionSource]" class="caption-controls" :key="activeCaptionSource + '-' + caption.id">
                  <caption-item 
                    @select-caption="selectCaption"
                    @set-custom-offset="setCustomOffset"
                    :caption="caption" 
                    :custom-offsets="customOffsets"
                    :isAutoPauseMode="isAutoPauseMode"
                    :isOffsetMode="isOffsetMode"
                    :currentTime="bufferTime"
                  ></caption-item>
                </span>
              </template>
            </div>
          </div>
        </div>
        `,
});

// Video List Component
Vue.component("video-list", {
  data() {
    return {
      videos: [],
      selectedVideos: new Set(),
      currentPath: [],
      isLoading: true,
      error: null,
      isDragging: false,
      dragOverIndex: -1,
      isUploading: false,
      uploadProgress: 0,
    };
  },
  computed: {
    folders() {
      return this.videos.filter((v) => v.isDirectory);
    },
    files() {
      return this.videos.filter((v) => !v.isDirectory);
    },
    selectedCount() {
      return this.selectedVideos.size;
    },
  },
  template: `
          <div class="video-list" 
               @dragover.prevent="onDragOver"
               @dragleave.prevent="onDragLeave"
               @drop.prevent="onDrop"
               :class="{ 'drag-over': isDragging }">
            <div class="flex justify-between items-center mb-4">
              <div class="flex items-center gap-2">
                <h2 class="text-xl font-semibold">Videos</h2>
                <div v-if="currentPath.length" class="text-sm text-gray-400">
                  / {{ currentPath.join(' / ') }}
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button v-if="selectedCount" class="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700" @click="playSelected">
                  Play Selected ({{ selectedCount }})
                </button>
                <button v-if="videos.length" class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" @click="selectAll">
                  Select All
                </button>
                <button v-if="selectedCount" class="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700" @click="clearSelection">
                  Clear
                </button>
                <button class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" @click="loadVideos(currentPath.join('/'))" :disabled="isLoading">
                  Refresh
                </button>
              </div>
            </div>
            <div v-if="isUploading" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
              <div class="bg-gray-800 p-6 rounded-lg text-center">
                <div class="mb-4 text-lg">Uploading files...</div>
                <div class="w-full bg-gray-700 rounded-full h-2.5">
                  <div class="bg-blue-600 h-2.5 rounded-full" :style="{ width: uploadProgress + '%' }"></div>
                </div>
                <div class="mt-2 text-sm text-gray-400">{{ uploadProgress.toFixed(0) }}%</div>
              </div>
            </div>
            <div v-if="isLoading" class="text-center py-8">Loading videos...</div>
            <div v-else-if="error" class="text-red-500 py-4">{{ error }}</div>
            <div v-else-if="!videos.length" class="text-center py-8">No videos found.</div>
            <div v-else class="grid gap-4">
              <div v-if="currentPath.length" class="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer" @click="navigate('..')">
                <span>&larr; Back</span>
              </div>
              <div v-for="v in folders" :key="v.path" class="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer" @click="navigate(v.name)">
                📁 {{ v.name }}<br><small>{{ formatDate(v.lastModified) }}</small>
              </div>
              <div v-for="v in files" :key="v.path" class="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer" :class="{ 'ring-2 ring-blue-500': selectedVideos.has(v.path) }" @click="onVideoClick($event, v)" @dblclick="onVideoSelected(v)">
                🎬 {{ v.name }}<br><small>{{ formatSize(v.size) }} • {{ formatDate(v.lastModified) }}</small>
              </div>
            </div>
            <div v-if="videos.length" class="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-800 flex justify-center items-center gap-4">
              <small class="text-gray-400">{{ selectedCount ? selectedCount + ' selected' : 'No selection' }}</small>
              <button class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700" 
                      @click="playSelected" 
                      :disabled="!selectedCount"
                      @keyup.enter="playSelected"
                      :class="{'opacity-50 cursor-not-allowed': !selectedCount}">
                Play Selected
              </button>
              <small class="text-gray-400">Enter=Play • Ctrl+A=Select All</small>
            </div>
          </div>`,
  methods: {
    onVideoSelected(video) {
      // Emit the full video object with URL
      this.$emit("select", {
        ...video,
        url: `/videos${video.path.startsWith("/") ? "" : "/"}${video.path}`,
      });
    },

    onVideoClick(e, video) {
      // Prevent default to avoid double-triggering with double-click
      e.preventDefault();
      e.stopPropagation();
      this.toggleSelect(video);
    },

    onDragOver(e) {
      e.preventDefault();
      e.stopPropagation();
      this.isDragging = true;
    },

    onDragLeave(e) {
      e.preventDefault();
      e.stopPropagation();
      this.isDragging = false;
    },

    async onDrop(e) {
      e.preventDefault();
      e.stopPropagation();
      this.isDragging = false;

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      this.isUploading = true;
      this.uploadProgress = 0;
      this.error = null;

      try {
        const formData = new FormData();
        const validFiles = files.filter(
          (file) =>
            file.type.startsWith("video/") ||
            [".mp4", ".webm", ".ogg", ".mov", ".mkv", ".avi"].some((ext) =>
              file.name.toLowerCase().endsWith(ext)
            )
        );

        if (validFiles.length === 0) {
          this.error = "No valid video files found";
          return;
        }

        validFiles.forEach((file) => {
          formData.append("files", file);
        });

        // Add current path if we're in a directory
        const currentPath = this.currentPath.join("/");
        if (currentPath) {
          formData.append("path", currentPath);
        }

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(error || "Upload failed");
        }

        // Refresh the video list
        this.loadVideos(currentPath);
      } catch (error) {
        console.error("Upload error:", error);
        this.error = "Upload failed: " + (error.message || "Unknown error");
      } finally {
        this.isUploading = false;
      }
    },
    handleDragStart(e, video) {
      e.dataTransfer.setData("text/plain", video.path);
      e.dataTransfer.effectAllowed = "move";
    },

    handleDragOver(e, index) {
      e.preventDefault();
      this.dragOverIndex = index;
      e.dataTransfer.dropEffect = "move";
    },

    handleDragLeave() {
      this.dragOverIndex = -1;
    },

    handleDrop(e, targetIndex) {
      e.preventDefault();
      this.dragOverIndex = -1;

      const sourcePath = e.dataTransfer.getData("text/plain");
      if (!sourcePath) return;

      const sourceIndex = this.videos.findIndex((v) => v.path === sourcePath);
      if (sourceIndex === -1 || sourceIndex === targetIndex) return;

      // Reorder videos array
      const newVideos = [...this.videos];
      const [movedVideo] = newVideos.splice(sourceIndex, 1);

      // Adjust target index if moving item down in the list
      const adjustedTargetIndex =
        sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
      newVideos.splice(adjustedTargetIndex, 0, movedVideo);

      this.videos = newVideos;
    },

    async loadVideos(path = "") {
      console.log("loadVideos", path);
      this.isLoading = true;
      this.error = null;
      try {
        const res = await fetch(`/api/videos?path=${encodeURIComponent(path)}`);
        const data = await res.json();
        this.videos = data.videos.sort((a, b) =>
          a.isDirectory === b.isDirectory
            ? a.name.localeCompare(b.name)
            : b.isDirectory
            ? 1
            : -1
        );
        console.log("loadVideos success", this.videos.length);
      } catch (e) {
        console.error("loadVideos error", e);
        this.error = e.message || "Failed to load";
      } finally {
        this.isLoading = false;
        console.log("loadVideos done");
      }
    },
    formatSize(bytes) {
      const units = ["B", "KB", "MB", "GB"];
      let i = 0;
      let s = bytes;
      while (s >= 1024 && i < units.length - 1) {
        s /= 1024;
        i++;
      }
      return s.toFixed(1) + " " + units[i];
    },
    formatDate(ts) {
      return new Date(ts).toLocaleString();
    },
    navigate(name) {
      if (name === "..") this.currentPath.pop();
      else this.currentPath.push(name);
      this.loadVideos(this.currentPath.join("/"));
    },
    toggleSelect(v) {
      this.selectedVideos.has(v.path)
        ? this.selectedVideos.delete(v.path)
        : this.selectedVideos.add(v.path);
    },
    selectAll() {
      this.selectedVideos = new Set(this.files.map((f) => f.path));
    },
    clearSelection() {
      this.selectedVideos.clear();
    },
    playSelected() {
      const selected = this.files.filter((f) =>
        this.selectedVideos.has(f.path)
      );
      if (!selected.length) return;

      // Emit the select event to the parent component
      if (selected.length === 1) {
        this.onVideoSelected(selected[0]);
      } else {
        // Emit a playlist of videos
        this.$emit(
          "playlist",
          selected.map((video) => ({
            ...video,
            url: `/videos${video.path.startsWith("/") ? "" : "/"}${video.path}`,
          }))
        );
      }
    },
    emitSelect(v) {
      this.onVideoSelected(v);
    },
  },

  handleKeyDown(e) {
    if (
      e.key === "Enter" &&
      this.selectedCount &&
      !e.shiftKey &&
      !e.ctrlKey &&
      !e.altKey &&
      !e.metaKey
    ) {
      e.preventDefault();
      e.stopPropagation();
      this.playSelected();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
      e.preventDefault();
      e.stopPropagation();
      this.selectAll();
    }
  },
  mounted() {
    console.log("mounted videoList");
    this.loadVideos();
  },
});

// Main Vue instance
function createApp() {
  var vm = new Vue({
    el: "#app",
    template: `<div>
  <div v-show="showVideoList" class="video-list-view"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; background: #1a1a1a; color: white;">
    <div class="video-list-container">
      <video-list ref="videoList" @select="onVideoSelected" @playlist="onPlaylistReceived"></video-list>
    </div>
  </div>
  
  <div v-show="!showVideoList">
    <div id="animebook-drop-wrapper" class="drop-wrapper" :class="dropWrapperClass"
      @dragover.prevent="onFileDragover" @dragleave="onFileDragleave" @drop.prevent="onFileDrop">
      <div class="app-container" :style="calcAppStyle()" v-cloak>
        <input id="ab-file-browse-input" @change="onFileInputChange" type="file"
          accept=".srt,.ass,.vtt,.mp3,.m4a,.aac,.flac,.ogg,.wav,.opus,.mkv,.mp4,.avi" multiple hidden />
        
        <div style="display: none;">
          <svg id="svg-library" viewBox="0 0 1792 1792">
            <path id="plus-svg"
              d="M9.5 7.5v-1q0-0.203-0.148-0.352t-0.352-0.148h-2v-2q0-0.203-0.148-0.352t-0.352-0.148h-1q-0.203 0-0.352 0.148t-0.148 0.352v2h-2q-0.203 0-0.352 0.148t-0.148 0.352v1q0 0.203 0.148 0.352t0.352 0.148h2v2q0 0.203 0.148 0.352t0.352 0.148h1q0.203 0 0.352-0.148t0.148-0.352v-2h2q0.203 0 0.352-0.148t0.148-0.352zM12 7q0 1.633-0.805 3.012t-2.184 2.184-3.012 0.805-3.012-0.805-2.184-2.184-0.805-3.012 0.805-3.012 2.184-2.184 3.012-0.805 3.012 0.805 2.184 2.184 0.805 3.012z" />
            <path id="spinner-svg"
              d="M526 1394q0 53-37.5 90.5t-90.5 37.5q-52 0-90-38t-38-90q0-53 37.5-90.5t90.5-37.5 90.5 37.5 37.5 90.5zm498 206q0 53-37.5 90.5t-90.5 37.5-90.5-37.5-37.5-90.5 37.5-90.5 90.5-37.5 90.5 37.5 37.5 90.5zm-704-704q0 53-37.5 90.5t-90.5 37.5-90.5-37.5-37.5-90.5 37.5-90.5 90.5-37.5 90.5 37.5 37.5 90.5zm1202 498q0 52-38 90t-90 38q-53 0-90.5-37.5t-37.5-90.5 37.5-90.5 90.5-37.5 90.5 37.5 37.5 90.5zm-964-996q0 66-47 113t-113 47-113-47-47-113 47-113 113-47 113 47 47 113zm1170 498q0 53-37.5 90.5t-90.5 37.5-90.5-37.5-37.5-90.5 37.5-90.5 90.5-37.5 90.5 37.5 37.5 90.5zm-640-704q0 80-56 136t-136 56-136-56-56-136 56-136 136-56 136 56 56 136zm530 206q0 93-66 158.5t-158 65.5q-93 0-158.5-65.5t-65.5-158.5q0-92 65.5-158t158.5-66q92 0 158 66t66 158z" />
            <path id="success-svg"
              d="M1412 734q0-28-18-46l-91-90q-19-19-45-19t-45 19l-408 407-226-226q-19-19-45-19t-45 19l-91 90q-18 18-18 46 0 27 18 45l362 362q19 19 45 19 27 0 46-19l543-543q18-18 18-45zm252 162q0 209-103 385.5t-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103 385.5 103 279.5 279.5 103 385.5z" />
            <path id="alert-svg"
              d="M896 128q209 0 385.5 103t279.5 279.5 103 385.5-103 385.5-279.5 279.5-385.5 103-385.5-103-279.5-279.5-103-385.5 103-385.5 279.5-279.5 385.5-103zm128 1247v-190q0-14-9-23.5t-22-9.5h-192q-13 0-23 10t-10 23v190q0 13 10 23t23 10h192q13 0 22-9.5t9-23.5zm-2-344l18-621q0-12-10-18-10-8-24-8h-220q-14 0-24 8-10 6-10 18l17 621q0 10 10 17.5t24 7.5h185q14 0 23.5-7.5t10.5-17.5z" />
          </svg>
        </div>
        
        <div class="video-subtitles-missing hint" v-show="!videoUrl && !captionsUrl">
          <p>Drag-and-drop a video file and subtitle file to this page, or <a href="#" @click="onFileBrowse">browse</a></p>
        </div>
        
        <div class="video-missing" v-show="!videoUrl && captionsUrl && !shouldShowVideoError">
          <div class="hint">
            <p>Drag-and-drop a video file, or <a href="#" @click="onFileBrowse">browse</a></p>
          </div>
        </div>
        
        <div class="subtitles-missing" v-show="videoUrl && !captionsUrl && !shouldShowSubtitlesError">
          <div class="hint">
            <p>Drag-and-drop a subtitles file (vtt, srt or ass), or <a href="#" @click="onFileBrowse">browse</a></p>
          </div>
        </div>
        
        <div class="video-error" v-show="shouldShowVideoError">
          <div class="hint">
            <div>
              There was an error loading the video file {{videoFileName}}.
              Try a different file. Note that your browser may not support certain file formats like HEVC/H.265 video or
              AC3 audio.
              See <a href="#" @click="toggleHelp(); enableHelpMode('tips')" class="monospace unselectable">Tips</a>.
            </div>
            <br>
            <div style="font-size: 1.5rem;" v-if="videoErrorMessage">
              Browser error message: <span class="monospace">{{videoErrorMessage}}</span>
            </div>
          </div>
        </div>
        
        <div class="subtitles-error" v-show="shouldShowSubtitlesError">
          <div class="hint">
            There was an error parsing the subtitles file {{subtitlesFileName}}.
            <span v-if="subtitlesError">{{subtitlesError}}</span>
          </div>
        </div>
        
        <div :class="notifyTextClass" v-if="notifyText" v-html="notifyText"></div>
        
        <!-- Replace the simple video with your full video wrapper -->
        <div class="video-wrapper" :class="videoContainerClass" v-show="videoUrl && !shouldShowVideoError">
          <video id="ab-video-element" class="video-element" :style="videoStyle" :src="videoUrl" @error="onVideoError"
            @timeupdate="onTimeUpdate" crossorigin="anonymous" :controls="savedSettings.showVideoControls"
            disablePictureInPicture tabIndex="-1" @focus="onVideoFocus" @click="onVideoClick" @seeked="onVideoSeek"
            @loadeddata="onVideoLoad" preload="auto" playsinline webkit-playsinline x5-playsinline
            x5-video-player-type="h5" x5-video-player-fullscreen="true" x5-video-orientation="landscape"
            :key="videoKey">
            <track v-if="captionsUrl" :key="trackKey" kind="subtitles" :src="captionsUrl" default />
            <p>Your browser doesn't support HTML5 video. Here is a <a :href="videoUrl">link to the video</a> instead.</p>
          </video>

          <div class="current-caption"
            :key="shownCaptionsKey" lang="ja" v-html="displayedHtml" :style="captionContainerStyle"></div>
        </div>

        <button @click="toggleVideoList" class="back-button">Back to Videos</button>

        <span id="ab-meta-data" style="display: none;" :data-audio-track="selectedAudioTrack || 0"></span>
        <div id="resize-bar-wrapper" class="resize-bar-wrapper" lang="ja">
          <div id="ab-extension-popup-wrapper"></div>
          <div class="resize-bar" @click.stop.prevent="onResizeBarClick" @mousedown.stop.prevent="onResizeBarMouseDown"></div>
        </div>
        
        <div class="sidebar">
          <caption-bar @select-caption="selectCaption" @set-custom-offset="setCustomOffset"
            @switch-source="switchCaptionSource" :captions="filteredCaptions" :custom-offsets="customOffsets"
            :is-auto-pause-mode="isAutoPauseMode" :is-offset-mode="isOffsetMode" :current-time="currentTime"
            v-if="captionSources.length > 0" :caption-sources="captionSources"
            :active-caption-source="activeCaptionSource"></caption-bar>
            
          <div v-if="captionSources.length > 0 && isOffsetMode" class="offset-hint unselectable">Select the subtitle that ends where
            the video currently is: {{displayAsVideoTime(currentTime)}}</div>
            
          <div class="auto-pause-text unselectable" v-if="isAutoPauseMode">Auto Pause <span
              style="display: inline-block;">:</span><span v-html="autoPauseIcon"></span></div>
              
          <div v-if="captionSources.length > 0" class="controls">
            <a tabindex="4" :class="helpClass" @click="toggleHelp(); enableHelpMode('hotkeys')"><span>?</span></a>
            <a v-if="audioTracks && audioTracks.length > 1" tabindex="3" :class="audioTrackClass"
              @click="cycleAudioTrack()"><span>{{selectedAudioTrack + 1}}/{{audioTracks.length}}</span></a>
            <input form="novalidatedform" type="number" step="0.1" tabindex="2" @keydown="onInputKeyDown"
              @wheel="onOffsetInputScroll" class="offset-input" v-model="subtitlesOffsetInput" />
            <a tabindex="1" :class="offsetButtonClass" @click="toggleOffsetMode()">
              <span class="offset-text">{{this.isOffsetMode ? 'Cancel' : 'Offset Subtitles'}}</span>
            </a>
          </div>
        </div>
        
        <div v-if="shouldShowHelpPopup" class="help-popup">
          <div class="exit-popup unselectable" @click="toggleHelp()">&times;</div>
          <div class="help-mode-tab-container">
            <div :class="helpButtonClass('hotkeys')" @click="enableHelpMode('hotkeys')">Hotkeys</div>
            <div :class="helpButtonClass('appearance')" @click="enableHelpMode('appearance')">Appearance</div>
            <div :class="helpButtonClass('tips')" @click="enableHelpMode('tips')">Tips</div>
            <div :class="helpButtonClass('anki-automatic-export')" @click="enableHelpMode('anki-automatic-export')">Anki Export</div>
          </div>
          
          <div v-if="helpMode === 'hotkeys'" class="help-inner">
            <div class="table">
              <div class="table-row">
                <div class="table-head">Command</div>
                <div class="table-head">Description</div>
              </div>
              <div class="table-row">
                <div class="table-cell">Left/Right</div>
                <div class="table-cell">Move backward/forward</div>
              </div>
              <!-- Table rows truncated for brevity -->
            </div>
          </div>
          
          <div v-if="helpMode === 'appearance'" class="help-inner" style="font-size: 1.2rem;">
            <!-- Content truncated for brevity -->
          </div>
          
          <div v-if="helpMode === 'tips'" class="help-inner">
            <!-- Content truncated for brevity -->
          </div>
          
          <div v-if="helpMode === 'anki-automatic-export'" class="help-inner">
            <!-- Content truncated for brevity -->
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`,
    data: {
      // Video list related
      showVideoList: true,
      videoUrl: null,
      currentVideo: null,
      videoPlaylist: [],
      currentPlaylistIndex: -1,

      // Your existing subtitle app data
      subtitleContents: {},
      subtitleOrder: [],
      subtitlesOffsetInput: "0.0",
      customOffsets: {},
      videoFileName: null,
      subtitlesFileName: null,
      activeCaptionIds: [],
      activeCaptionSource: null,
      captionSources: [],
      currentTime: 0.0,
      shouldShowVideoError: false,
      videoErrorMessage: null,
      shouldShowSubtitlesError: false,
      subtitlesError: null,
      isDraggingSidebar: false,
      sideBarDragStartX: 0,
      sideBarDragDx: 0,
      sideBarX: 0.86,
      previousSideBarX: 0.86,
      captions: {},
      isDraggingFile: false,
      isOffsetMode: false,
      resizeBarClick: null,
      videoKey: 1,
      trackKey: 1,
      captionMoveLimitSeconds: 12.0,
      textSelection: "",
      isAutoPauseMode: false,
      autoPauseCaptions: [],
      autoPauseMaxBufferSeconds: 0.3,
      preCaptionAutoPauseNet: 0.25,
      minimumPercentNeededToPlayBeforeAutoPause: 0.15,
      skipNextAutoPause: false,
      lastPauseTime: 0.0,
      isPlaying: false,
      notifyText: null,
      notifyCount: 0,
      shouldShowHelpPopup: false,
      scheduledImageCopies: 0,
      shouldShowMainCaption: true,
      audioTracks: null,
      audioTrackCount: null,
      selectedAudioTrack: null,
      mouseTimeout: null,
      cursorVisible: true,
      helpMode: "hotkeys",
      bigJumpSeconds: 87,
      isLocalStorageAvailable: true,
      shouldHideRegexMatches: false,
      maxCaptionLines: 7,
      isMaxLinesMode: false,
      savedSettings: {
        videoAlignment: "top",
        showVideoControls: true,
        subtitle1FontSize: 1.0,
        subtitle2FontSize: 1.0,
        subtitle1FontWeight: 600,
        subtitle2FontWeight: 400,
        subtitle1TextShadowSize: 5,
        subtitle2TextShadowSize: 5,
        subtitleVerticalPosition: 5,
        subtitleDelay: 0.0, // in seconds
        showSubtitle1: true,
        showSubtitle2: true,
        deletedCaptionIds: [], // Track deleted caption IDs
        watchedHistory: {}, // Track watch progress by filename
        regexReplacements: [
          { regex: "\\(\\(.*?\\)\\)", replaceText: "" },
          { regex: "\\(.*?\\)", replaceText: "" },
          { regex: "（.*?）", replaceText: "" },
        ],
      },
      autoSaveInterval: null,
    },
    computed: {
      filteredCaptions: function () {
        const filtered = {};
        for (const sourceId in this.captions) {
          if (
            this.captions.hasOwnProperty(sourceId) &&
            this.captions[sourceId]
          ) {
            filtered[sourceId] = this.captions[sourceId].filter(
              (c) => !this.savedSettings.deletedCaptionIds.includes(c.id)
            );
          }
        }
        return filtered;
      },
      dropWrapperClass: function () {
        return this.isDraggingFile ? "dragging-file" : "";
      },
      subtitlesOffsetSeconds: function () {
        return Utils.parseInputNum(this.subtitlesOffsetInput);
      },
      captionsUrl: function () {
        if (
          !this.activeCaptionSource ||
          !this.captions[this.activeCaptionSource]
        ) {
          return null;
        }

        try {
          var captions = this.captions[this.activeCaptionSource];
          var vtt = this.formatVtt(captions);
          if (!vtt) {
            this.shouldShowSubtitlesError = true;
            this.subtitlesError = "Could not format captions into VTT.";
            return null;
          }

          var uri = "data:text/vtt;charset=utf-8," + encodeURIComponent(vtt);
          this.shouldShowSubtitlesError = false;
          this.subtitlesError = null;
          return uri;
        } catch (error) {
          this.subtitlesError = error.message;
          this.shouldShowSubtitlesError = true;
          return null;
        }
      },
      captionsMap: function () {
        var map = {};
        if (
          this.activeCaptionSource &&
          this.captions[this.activeCaptionSource]
        ) {
          this.captions[this.activeCaptionSource].forEach(function (c) {
            map[c.id] = c;
          });
        }
        return map;
      },
      allCaptionsMap: function () {
        if (!this._cachedAllCaptionsMap) {
          var map = {};
          var self = this;
          Object.keys(this.captions).forEach(function (sourceId) {
            if (self.captions[sourceId]) {
              self.captions[sourceId].forEach(function (c) {
                map[c.id] = c;
              });
            }
          });
          this._cachedAllCaptionsMap = map;
          return map;
        }

        return this._cachedAllCaptionsMap;
      },
      activeCaptions: function () {
        if (this.autoPauseCaptions.length > 0) return this.autoPauseCaptions;

        if (
          !this.activeCaptionSource ||
          !this.captions[this.activeCaptionSource]
        )
          return [];

        return this.idsToCaptions(this.activeCaptionIds);
      },
      isVoicedTime: function () {
        var time = this.currentTime;
        var isVoiced = function (caption) {
          return caption.startTime <= time && time <= caption.endTime;
        };
        return this.activeCaptions.some(isVoiced);
      },
      shownCaptions: function () {
        if (
          !this.captions ||
          !this.captionSources ||
          this.captionSources.length === 0
        )
          return [];

        var time = this.currentTime;
        var self = this;
        var result = [];

        var maxBuffer = 0.1; // 0.3s
        var bufferRate = 0.002; // 30 char = 0.15s

        var isActiveAtTime = function (caption) {
          var smartBuffer = Math.min(
            maxBuffer,
            caption.text.length * bufferRate
          );
          return (
            caption.startTime <= time && time <= caption.endTime + smartBuffer
          );
        };

        this.captionSources.forEach(function (sourceId) {
          if (!self.captions[sourceId] || self.captions[sourceId].length === 0)
            return;

          var actives = self.captions[sourceId]
            .filter(isActiveAtTime)
            .filter(function (c) {
              return !self.savedSettings.deletedCaptionIds.includes(c.id);
            });

          actives.forEach(function (cap) {
            cap.sourceId = sourceId;
            result.push(cap);
          });
        });

        result.sort((a, b) => a.startTime - b.startTime);

        var limit = this.isMaxLinesMode ? 50 : this.maxCaptionLines;
        if (result.length > limit) {
          return result.slice(result.length - limit);
        }

        return result;
      },
      displayedLines: function () {
        if (
          !this.shownCaptions ||
          !this.shouldShowMainCaption ||
          this.subtitleOrder.length === 0
        )
          return [];

        const linesBySource = {};
        for (const caption of this.shownCaptions) {
          if (!caption?.text || !caption.sourceId) continue;
          if (!linesBySource[caption.sourceId]) {
            linesBySource[caption.sourceId] = [];
          }
          // Concatenate lines from multiple simultaneous captions of the same source
          const captionLines = caption.text.split("\n").filter((l) => l.trim());
          linesBySource[caption.sourceId].push(...captionLines);
        }

        const orderedLines = [];
        for (const sourceId of this.subtitleOrder) {
          if (linesBySource[sourceId]) {
            // Join lines from a single source back into one block, and pass it with sourceId for styling.
            orderedLines.push({
              sourceId: sourceId,
              text: linesBySource[sourceId].join("\n"),
            });
          }
        }
        return orderedLines;
      },
      displayedHtml: function () {
        if (!this.displayedLines || this.displayedLines.length === 0) return "";

        var processedLines = [];

        for (var i = 0; i < this.displayedLines.length; i++) {
          var lineInfo = this.displayedLines[i];
          var line = this.cleanSubtitleText(lineInfo.text);
          if (!line || !line.trim()) continue;

          var sourceIndex = this.subtitleOrder.indexOf(lineInfo.sourceId);

          // For now, we only support styling for the first two subtitle tracks
          if (sourceIndex > 1) continue;

          var isSubtitle1 = sourceIndex === 0;
          var isSubtitle2 = sourceIndex === 1;

          if (
            (isSubtitle1 && !this.savedSettings.showSubtitle1) ||
            (isSubtitle2 && !this.savedSettings.showSubtitle2)
          ) {
            continue;
          }
          var lineClass = isSubtitle1 ? "subtitle-1" : "subtitle-2";
          var fontSize = isSubtitle1
            ? this.savedSettings.subtitle1FontSize
            : this.savedSettings.subtitle2FontSize;
          var fontWeight = isSubtitle1
            ? this.savedSettings.subtitle1FontWeight
            : this.savedSettings.subtitle2FontWeight;
          var textShadowSize = isSubtitle1
            ? this.savedSettings.subtitle1TextShadowSize
            : this.savedSettings.subtitle2TextShadowSize;

          var displayStyle = `font-size: ${fontSize}em; font-weight: ${fontWeight}; text-shadow: ${this.generateTextShadow(
            textShadowSize
          )};`;

          processedLines.push(
            `<div class="${lineClass}" style="${displayStyle}">${line}</div>`
          );
        }

        return processedLines.join("");
      },
      captionContainerStyle: function () {
        return {
          bottom: `${this.savedSettings.subtitleVerticalPosition}%`,
        };
      },
      shownCaptionsKey: function () {
        if (!this.shownCaptions || this.shownCaptions.length === 0) return "";
        var self = this;
        return this.shownCaptions
          .map(function (c) {
            return (c.sourceId || self.activeCaptionSource || "") + ":" + c.id;
          })
          .join("_");
      },
      offsetButtonClass: function () {
        return (
          "offset-button button" +
          (this.isOffsetMode ? " on" : " off") +
          (this.isAutoPauseMode ? " auto-pause" : "") +
          " unselectable"
        );
      },
      notifyTextClass: function () {
        return "notify-text" + (this.notifyCount > 0 ? " on" : " off");
      },
      videoContainerClass: function () {
        return (
          "video-container" +
          (this.savedSettings.videoAlignment === "center" ? " center" : " top")
        );
      },
      audioTrackClass: function () {
        return (
          "audio-track button" +
          (this.isAutoPauseMode ? " auto-pause" : "") +
          " unselectable"
        );
      },
      helpClass: function () {
        return (
          "help button" +
          (this.isAutoPauseMode ? " auto-pause" : "") +
          " unselectable"
        );
      },
      autoPauseIcon: function () {
        if (!this.isPlaying)
          return '<span class="auto-pause-icon paused">Paused</span>';
        else if (this.skipNextAutoPause)
          return '<span class="auto-pause-icon skipping">Skipping</span>';
        else return '<span class="auto-pause-icon playing">Playing</span>';
      },
      videoTitle: function () {
        var self = this;
        if (!self.videoFileName) return "Animebook";

        var matches = self.videoFileName
          .replace(/[a-uw-zA-UW-Z]/g, "a")
          .replace(/[^a^\d]/g, " ")
          .split(" ")
          .filter(function (numText) {
            return numText && numText.indexOf("a") === -1;
          });

        var episodeNumber = null;
        if (
          matches &&
          !matches.every(function (numText) {
            return self.videoFileName.startsWith(numText);
          })
        ) {
          episodeNumber = matches
            .map(function (numText) {
              return parseInt(numText) + "";
            })
            .join(".");
        }
        return (
          (episodeNumber ? episodeNumber + " | " : "") +
          self.videoFileName +
          " | " +
          "Animebook"
        );
      },
      videoStyle: function () {
        if (!this.cursorVisible && this.isPlaying) return "cursor: none;";
        return "";
      },
    },
    created: function () {
      this.loadSavedSettings();
      this.setUpKeybindings();
    },
    watch: {
      activeCaptions: function (newValue, oldValue) {
        if (oldValue)
          oldValue.forEach(function (caption) {
            caption.isActive = false;
          });
        if (!newValue || newValue.length === 0) return;
        newValue.forEach(function (caption) {
          caption.isActive = true;
        });

        if (this.sideBarX + this.sideBarDragDx > 1.0 - 0.0001) return;
        if (
          document.activeElement &&
          document.activeElement.classList.contains("custom-offset-input")
        )
          return;
        this.scrollToCaption(newValue[0].id);
      },
      captionsUrl: function (newValue, oldValue) {
        this.trackKey = this.trackKey + 1;
        var isFirefox = typeof InstallTrigger !== "undefined";
        if (isFirefox) this.videoKey = this.videoKey + 1;
      },
      currentTime: function (newTime, oldTime) {
        var video = this.getVideoElement();
        this.isPlaying = video ? !this.getVideoElement().paused : false;
        this.handleAutoPauseTimeUpdate(newTime);
      },
      isPlaying: function (newValue, oldValue) {
        if (!newValue) this.skipNextAutoPause = false;

        if (newValue !== oldValue) this.showCursor();
      },
      videoTitle: function (newValue, oldValue) {
        document.title = newValue;
      },
      selectedAudioTrack: function (newValue, oldValue) {
        if (!this.audioTracks || this.audioTracks.length <= newValue) return;

        this.enableAudioTrack(newValue);
        // Video gets frozen after an audio track change, so update the time
        this.getVideoElement().currentTime = this.currentTime;
      },
      subtitlesOffsetSeconds: function () {
        this.processAllSubtitles();
      },
      customOffsets: {
        handler: function () {
          this.processAllSubtitles();
        },
        deep: true,
      },
      savedSettings: {
        handler: function (newValue, oldValue) {
          try {
            window.localStorage.setItem(
              "savedSettings",
              JSON.stringify(newValue)
            );
            this.isLocalStorageAvailable = true;
          } catch (e) {
            this.isLocalStorageAvailable = false;
          }
        },
        deep: true,
      },
    },
    methods: {
      cycleSubtitleOrder: function (reverse = false) {
        if (this.subtitleOrder.length < 2) return;
        if (reverse) {
          this.subtitleOrder.unshift(this.subtitleOrder.pop());
        } else {
          this.subtitleOrder.push(this.subtitleOrder.shift());
        }
        this.notify("Subtitle order changed");
      },
      processAllSubtitles: function () {
        for (const sourceId in this.subtitleContents) {
          if (Object.hasOwnProperty.call(this.subtitleContents, sourceId)) {
            const content = this.subtitleContents[sourceId];
            const captions = this.fileToCaptions(
              content,
              this.subtitlesOffsetSeconds,
              this.customOffsets
            );
            if (captions) {
              this.$set(this.captions, sourceId, captions);
              this.furigana(sourceId);
            }
          }
        }
      },
      cleanSubtitleText: function (text) {
        if (!text) return "";

        // Don't mess with ruby/rt tags at all - they're critical for Japanese
        text = text.replace(/<(?!\/?(?:ruby|rt|rp))[^>]*>/g, "");

        // Only clean up basic HTML entities and whitespace
        return text
          .replace(/&gt;/g, ">")
          .replace(/&lt;/g, "<")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/\s+/g, " ")
          .trim();
      },
      onVideoLoad: function (e) {
        var video = this.getVideoElement();
        if (!video.audioTracks || video.audioTracks.length === 0) {
          this.audioTracks = null;
          this.selectedAudioTrack = null;
          return;
        }

        var areNewTracksSameCount =
          this.audioTrackCount &&
          this.audioTrackCount === video.audioTracks.length;
        var previousSelectedAudioTrack = this.selectedAudioTrack;

        this.audioTracks = video.audioTracks;
        this.audioTrackCount = video.audioTracks.length;
        this.selectedAudioTrack = -1; // force update of the audio track button; it won't update if selectedAudioTrack doesn't change
        if (
          previousSelectedAudioTrack &&
          previousSelectedAudioTrack < this.audioTracks.length &&
          areNewTracksSameCount
        )
          this.selectedAudioTrack = previousSelectedAudioTrack;
        else this.selectedAudioTrack = 0;
        this.enableAudioTrack(this.selectedAudioTrack);
      },
      getVideoElement() {
        return document.getElementById("ab-video-element");
      },
      toggleVideoList() {
        this.showVideoList = !this.showVideoList;
        if (this.showVideoList && this.$refs.videoList) {
          this.$refs.videoList.loadVideos();
        }
      },
      onVideoSelected(video) {
        if (!video) {
          console.error("No video provided");
          return;
        }

        console.log("Video selected:", video);

        // Save progress of current video before loading new one
        if (this.videoUrl) {
          this.saveProgress();
        }

        this.showVideoList = false;
        this.currentVideo = video;
        this.shouldShowVideoError = false;
        this.videoErrorMessage = null;
        this.videoFileName = video.name;

        // If we have a File object, create an object URL for it
        if (video instanceof File) {
          if (this.videoUrl) {
            URL.revokeObjectURL(this.videoUrl);
          }
          this.videoUrl = URL.createObjectURL(video);
        } else if (video.url) {
          // If we have a URL, use it directly
          this.videoUrl = video.url;
        } else {
          console.error("Video object has no valid URL or File data:", video);
          this.shouldShowVideoError = true;
          this.videoErrorMessage = "Invalid video source";
          return;
        }

        // Load and play the video
        this.$nextTick(() => {
          const videoEl = this.getVideoElement();
          if (videoEl) {
            videoEl.load();
            videoEl
              .play()
              .then(() => {
                // Wait 5 seconds before restoring progress
                setTimeout(() => {
                  console.log("Restoring saved position after delay");
                  this.restoreProgress();
                }, 500);
              })
              .catch((error) => {
                console.error("Error playing video:", error);
                this.shouldShowVideoError = true;
                this.videoErrorMessage = error.message;

                // Still try to restore position even if autoplay fails
                setTimeout(() => {
                  console.log("Restoring saved position after autoplay error");
                  this.restoreProgress();
                }, 500);
              });
          }
        });
      },
      loadVideo: function (url) {
        // Save progress of current video before loading new one
        if (this.videoUrl) {
          this.saveProgress();
        }

        this.videoUrl = url;
        this.$nextTick(function () {
          const video = this.getVideoElement();
          video.load();
          video
            .play()
            .then(() => {
              // After video loads, try to restore its progress
              this.restoreProgress();
            })
            .catch((e) => {
              console.error("Video play error:", e);
              video.controls = true;
            });
        });
      },
      onPlaylistReceived(playlist) {
        if (playlist && playlist.length > 0) {
          this.videoPlaylist = playlist;
          this.currentPlaylistIndex = 0;
          this.onVideoSelected(playlist[0]);
        }
      },
      loadSavedSettings: function () {
        var json = null;
        try {
          json = window.localStorage.getItem("savedSettings");
        } catch (e) {
          console.error(e);
          this.isLocalStorageAvailable = false;
          return;
        }
        if (!json) return;

        var settings = JSON.parse(json);
        if (!settings) return;

        for (k in this.savedSettings) {
          if (settings.hasOwnProperty(k)) this.savedSettings[k] = settings[k];
        }
      },
      loadSettings: function () {
        var json = localStorage.getItem("animebook-settings");
        if (!json) return;

        var settings = JSON.parse(json);
        if (!settings) return;

        for (var k in this.savedSettings) {
          if (settings.hasOwnProperty(k)) this.savedSettings[k] = settings[k];
        }

        // Initialize watchedHistory if it doesn't exist
        if (!this.savedSettings.watchedHistory) {
          this.savedSettings.watchedHistory = {};
        }
      },

      saveSettings: function () {
        try {
          const settingsToSave = JSON.parse(JSON.stringify(this.savedSettings));
          localStorage.setItem(
            "animebook-settings",
            JSON.stringify(settingsToSave)
          );
          console.log("[DEBUG] saveSettings - Settings saved successfully");
        } catch (error) {
          console.error(
            "[ERROR] saveSettings - Failed to save settings:",
            error
          );
        }
      },

      saveProgress: function () {
        console.log("[DEBUG] saveProgress - Attempting to save progress");
        if (!this.videoUrl) {
          console.log("[DEBUG] saveProgress - No video URL");
          return;
        }

        const filename = this.extractFilename(this.videoUrl);
        if (!filename) {
          console.log(
            "[DEBUG] saveProgress - Could not extract filename from URL:",
            this.videoUrl
          );
          return;
        }

        const video = this.getVideoElement();
        if (!video) {
          console.log("[DEBUG] saveProgress - No video element");
          return;
        }

        // Only save if video has loaded and has a duration
        if (isNaN(video.duration) || video.duration <= 0) {
          console.log(
            "[DEBUG] saveProgress - Video not loaded or invalid duration"
          );
          return;
        }

        console.log(
          "[DEBUG] saveProgress - Current time:",
          video.currentTime,
          "Duration:",
          video.duration
        );

        // Initialize watchedHistory if it doesn't exist
        if (!this.savedSettings.watchedHistory) {
          console.log("[DEBUG] saveProgress - Initializing watchedHistory");
          this.savedSettings.watchedHistory = {};
        }

        // Create a backup of current settings
        const prevSettings = JSON.parse(JSON.stringify(this.savedSettings));

        try {
          // Update the watched history
          const currentTime = video.currentTime;
          const progressData = {
            date: new Date().toISOString(),
            timestamp: currentTime,
            time: this.formatTimeHHMMSS(currentTime),
            duration: video.duration,
            durationFormatted: this.formatTimeHHMMSS(video.duration),
            filename: filename,
            deletedCaptionIds: [
              ...(this.savedSettings.deletedCaptionIds || []),
            ],
          };

          console.log(
            "[DEBUG] saveProgress - Saving progress data:",
            progressData
          );
          this.savedSettings.watchedHistory[filename] = progressData;

          // Save to localStorage
          this.saveSettings();
          console.log(
            "[DEBUG] saveProgress - Progress saved successfully for",
            filename
          );
        } catch (error) {
          console.error(
            "[ERROR] saveProgress - Failed to save progress:",
            error
          );
          // Restore previous settings on error
          this.savedSettings = prevSettings;
        }
      },

      restoreProgress: function () {
        if (!this.videoUrl) return;

        const filename = this.extractFilename(this.videoUrl);
        if (!filename || !this.savedSettings.watchedHistory[filename]) return;

        const progress = this.savedSettings.watchedHistory[filename];
        const video = this.getVideoElement();

        // Only restore if video is long enough and position is valid
        if (
          progress.duration > 0 &&
          progress.timestamp > 0 &&
          progress.timestamp < progress.duration * 0.95
        ) {
          // Set video time
          video.currentTime = progress.timestamp;

          // Restore deleted captions for this video
          this.savedSettings.deletedCaptionIds = [
            ...(progress.deletedCaptionIds || []),
          ];

          this.notify(
            `Resuming from ${this.formatTime(
              progress.timestamp,
              progress.timestamp >= 3600
            )}`
          );
        }
      },

      /**
       * Format seconds into a time string (HH:MM:SS or MM:SS)
       * @param {number} totalSeconds - Total seconds to format
       * @param {boolean} [forceHours=false] - Always show hours even if zero
       * @returns {string} Formatted time string
       */
      formatTime: function (totalSeconds, forceHours = false) {
        // Handle invalid input
        if (isNaN(totalSeconds) || !isFinite(totalSeconds)) {
          return forceHours ? "00:00:00" : "00:00";
        }

        // Handle negative times
        const isNegative = totalSeconds < 0;
        let seconds = Math.abs(totalSeconds);

        // Calculate time components
        const hours = Math.floor(seconds / 3600);
        seconds %= 3600;
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);

        // Format components with leading zeros
        const pad = (num) => num.toString().padStart(2, "0");

        // Build time parts
        const parts = [];

        // Add hours if needed
        if (forceHours || hours > 0) {
          parts.push(pad(hours));
        }

        // Always add minutes and seconds
        parts.push(pad(minutes));
        parts.push(pad(seconds));

        // Join parts with colons
        let result = parts.join(":");

        // Add negative sign if needed
        if (isNegative) {
          result = "-" + result;
        }

        return result;
      },

      // Alias for backward compatibility
      formatTimeHHMMSS: function (seconds) {
        return this.formatTime(seconds, true);
      },

      /**
       * Extract filename from a URL, handling query parameters and paths
       * @param {string} url - The URL to extract filename from
       * @returns {string|null} The extracted filename or null if invalid
       */
      extractFilename: function (url) {
        if (!url) return null;
        try {
          // Handle both string URLs and URL objects
          const urlObj = new URL(url, window.location.href);
          const pathname = urlObj.pathname;
          // Get the last part of the path and remove any trailing slashes
          const filename = pathname.split("/").pop() || "";
          return filename || null;
        } catch (e) {
          console.error("Error extracting filename from URL:", e);
          return null;
        }
      },

      setUpKeybindings: function () {
        var self = this;
        window.addEventListener("keydown", function (e) {
          if (
            /textarea|select/i.test(event.target.nodeName) ||
            event.target.type === "text"
          )
            return;
          // Handle video list keys
          if (self.showVideoList) {
            // Call the component method directly
            if (self.$refs.videoList && self.$refs.videoList.handleKeyDown) {
              self.$refs.videoList.handleKeyDown(e);
            }
            return;
          }
          let videoNG = !self.videoUrl || self.shouldShowVideoError;
          let sidebarNG =
            self.captionSources.length === 0 || self.shouldShowSubtitlesError;
          let eitherNG = videoNG || sidebarNG;
          var stopEvent = function () {
            e.preventDefault();
            e.stopPropagation();
            // Ensure the video element keeps focus after key presses
            var videoElement = self.getVideoElement();
            if (videoElement) {
              setTimeout(function () {
                videoElement.focus();
              }, 10);
            }
          };
          switch (e.key) {
            case " ":
              if (videoNG) return;
              stopEvent(e);
              self.playPause();
              break;
            case "Enter":
              if (eitherNG) return;
              stopEvent(e);
              self.replayCaption();
              break;
            case "w":
              if (eitherNG) return;
              stopEvent(e);
              self.shouldShowMainCaption = !self.shouldShowMainCaption;
              self.notify(
                self.shouldShowMainCaption
                  ? "Subtitles shown"
                  : "Subtitles hidden"
              );
              break;
            case "ArrowUp":
              if (eitherNG) return;
              if (e.ctrlKey) {
                stopEvent(e);
                self.savedSettings.subtitleVerticalPosition = Math.min(
                  90,
                  self.savedSettings.subtitleVerticalPosition + 1
                );
                self.notify(
                  `V-Pos: ${self.savedSettings.subtitleVerticalPosition}%`
                );
              } else {
                stopEvent(e);
                self.shouldShowMainCaption = !self.shouldShowMainCaption;
                self.notify(
                  self.shouldShowMainCaption
                    ? "Subtitles shown"
                    : "Subtitles hidden"
                );
              }
              break;
            case "ArrowLeft":
              if (eitherNG) return;
              stopEvent(e);
              if (e.ctrlKey) {
                self.seek(-5);
              } else {
                self.previousCaption();
              }
              break;
            case "s":
              // replay current caption
              if (eitherNG) return;
              stopEvent(e);
              self.replayCaption();
              break;
            case "ArrowDown":
              if (eitherNG) return;
              if (e.ctrlKey) {
                stopEvent(e);
                self.savedSettings.subtitleVerticalPosition = Math.max(
                  0,
                  self.savedSettings.subtitleVerticalPosition - 1
                );
                self.notify(
                  `V-Pos: ${self.savedSettings.subtitleVerticalPosition}%`
                );
              } else {
                stopEvent(e);
                self.replayCaption();
              }
              break;
            case "ArrowRight":
              if (eitherNG) return;
              stopEvent(e);
              if (e.ctrlKey) {
                self.seek(5);
              } else {
                self.nextCaption();
              }
              break;
            case "A":
              if (sidebarNG) return;
              if (e.ctrlKey || e.altKey || e.metaKey) return;
              stopEvent(e);
              self.isAutoPauseMode = !self.isAutoPauseMode;
              self.lastPauseTime = self.getCurrentTime();
              break;
            case "j":
            case "J":
              if (sidebarNG) return;
              if (e.ctrlKey || e.altKey || e.metaKey) return;
              stopEvent(e);
              self.cycleSubtitleOrder();
              break;
            case "k":
            case "K":
              if (sidebarNG) return;
              if (e.ctrlKey || e.altKey || e.metaKey) return;
              stopEvent(e);
              self.cycleSubtitleOrder(true);
              break;
            case ".":
            case ">":
              if (eitherNG) return;
              if (e.ctrlKey || e.altKey || e.metaKey) return;
              stopEvent(e);
              self.seekScreenshot(1, !e.shiftKey);
              break;
            case ",":
            case "<":
              if (eitherNG) return;
              if (e.ctrlKey || e.altKey || e.metaKey) return;
              stopEvent(e);
              self.seekScreenshot(-1, !e.shiftKey);
              break;
            case "?":
              if (e.ctrlKey || e.altKey || e.metaKey) return;
              stopEvent(e);
              self.shouldShowHelpPopup = !self.shouldShowHelpPopup;
              break;
            case "S":
              if (videoNG) return;
              if (e.ctrlKey || e.altKey || e.metaKey) return;
              stopEvent(e);
              self.copyImage();
              break;
            case "c":
              if (eitherNG) return;
              if (e.ctrlKey || e.altKey || e.metaKey) return;
              stopEvent(e);
              self.copySubtitle();
              break;
            case "D":
              if (sidebarNG) return;
              if (e.ctrlKey || e.altKey || e.metaKey) return;
              stopEvent(e);
              var newFileName = self.subtitlesFileName;
              var dotIndex = newFileName.lastIndexOf(".");
              if (dotIndex !== -1 && newFileName.length - dotIndex < 5)
                newFileName = self.subtitlesFileName.substring(0, dotIndex);
              self.downloadString(
                self.formatSrt(self.captions),
                "srt",
                newFileName + ".srt"
              );
              break;
            case "v":
            case "V":
              if (eitherNG) return;
              if (e.ctrlKey || e.altKey || e.metaKey) return;
              stopEvent(e);
              if (e.ctrlKey) {
                // Shift+V: Toggle subtitle-2 visibility
                self.savedSettings.showSubtitle2 =
                  !self.savedSettings.showSubtitle2;
                self.notify(
                  `Subtitle 2: ${
                    self.savedSettings.showSubtitle2 ? "Shown" : "Hidden"
                  }`
                );
              } else {
                // V: Toggle subtitle-1 visibility
                self.savedSettings.showSubtitle1 =
                  !self.savedSettings.showSubtitle1;
                self.notify(
                  `Subtitle 1: ${
                    self.savedSettings.showSubtitle1 ? "Shown" : "Hidden"
                  }`
                );
              }
              break;
            case "y":
              toggleControls();
              break;
            case "b":
            case "B":
              if (sidebarNG) return;
              if (e.ctrlKey || e.altKey || e.metaKey) return;
              debugger;
              stopEvent(e);
              self.toggleSidebar();
              break;
            case "t":
            case "T":
              if (videoNG) return;
              if (e.ctrlKey || e.altKey || e.metaKey) return;
              stopEvent(e);
              self.cycleAudioTrack();
              break;
            case "Escape":
              if (self.shouldShowHelpPopup) {
                stopEvent(e);
                self.shouldShowHelpPopup = false;
              }
              break;
            case "\\":
            case "|":
              if (eitherNG) return;
              if (self.isAutoPauseMode && self.isPlaying) {
                stopEvent(e);
                self.skipNextAutoPause = true;
              } else if (self.isAutoPauseMode && !self.isPlaying) {
                stopEvent(e);
                self.playPause();
              }
              break;
            case "PageDown":
              if (eitherNG) return;
              stopEvent(e);
              self.seekXSeconds(self.bigJumpSeconds);
              break;
            case "PageUp":
              if (eitherNG) return;
              stopEvent(e);
              self.seekXSeconds(-self.bigJumpSeconds);
              break;
            case "g":
            case "G":
              if (eitherNG) return;
              stopEvent(e);
              if (e.altKey) {
                if (e.shiftKey) {
                  self.savedSettings.subtitle2FontWeight = Math.max(
                    100,
                    self.savedSettings.subtitle2FontWeight - 100
                  );
                  self.notify(
                    `Subtitle 2 Weight: ${self.savedSettings.subtitle2FontWeight}`
                  );
                } else {
                  self.savedSettings.subtitle1FontWeight = Math.max(
                    100,
                    self.savedSettings.subtitle1FontWeight - 100
                  );
                  self.notify(
                    `Subtitle 1 Weight: ${self.savedSettings.subtitle1FontWeight}`
                  );
                }
              } else if (e.ctrlKey) {
                if (e.shiftKey) {
                  self.savedSettings.subtitle2TextShadowSize = Math.max(
                    0,
                    self.savedSettings.subtitle2TextShadowSize - 1
                  );
                  self.notify(
                    `Subtitle 2 Shadow: ${self.savedSettings.subtitle2TextShadowSize}`
                  );
                } else {
                  self.savedSettings.subtitle1TextShadowSize = Math.max(
                    0,
                    self.savedSettings.subtitle1TextShadowSize - 1
                  );
                  self.notify(
                    `Subtitle 1 Shadow: ${self.savedSettings.subtitle1TextShadowSize}`
                  );
                }
              } else {
                if (e.shiftKey) {
                  self.savedSettings.subtitle2FontSize = Math.max(
                    0.5,
                    self.savedSettings.subtitle2FontSize - 0.1
                  );
                  self.notify(
                    `Subtitle 2 size: ${self.savedSettings.subtitle2FontSize.toFixed(
                      1
                    )}`
                  );
                } else {
                  self.savedSettings.subtitle1FontSize = Math.max(
                    0.5,
                    self.savedSettings.subtitle1FontSize - 0.1
                  );
                  self.notify(
                    `Subtitle 1 size: ${self.savedSettings.subtitle1FontSize.toFixed(
                      1
                    )}`
                  );
                }
              }
              break;
            case "R":
              if (eitherNG) return;
              if (e.ctrlKey || e.altKey || e.metaKey) return;
              stopEvent(e);
              self.shouldHideRegexMatches = !self.shouldHideRegexMatches;
              if (self.shouldHideRegexMatches) {
                self.notify("Parentheses hidden");
              } else {
                self.notify("Parentheses shown");
              }
              break;
            case "h":
            case "H":
              if (eitherNG) return;
              stopEvent(e);
              if (e.altKey) {
                if (e.shiftKey) {
                  self.savedSettings.subtitle2FontWeight = Math.min(
                    900,
                    self.savedSettings.subtitle2FontWeight + 100
                  );
                  self.notify(
                    `Subtitle 2 Weight: ${self.savedSettings.subtitle2FontWeight}`
                  );
                } else {
                  self.savedSettings.subtitle1FontWeight = Math.min(
                    900,
                    self.savedSettings.subtitle1FontWeight + 100
                  );
                  self.notify(
                    `Subtitle 1 Weight: ${self.savedSettings.subtitle1FontWeight}`
                  );
                }
              } else if (e.ctrlKey) {
                if (e.shiftKey) {
                  self.savedSettings.subtitle2TextShadowSize = Math.min(
                    10,
                    self.savedSettings.subtitle2TextShadowSize + 1
                  );
                  self.notify(
                    `Subtitle 2 Shadow: ${self.savedSettings.subtitle2TextShadowSize}`
                  );
                } else {
                  self.savedSettings.subtitle1TextShadowSize = Math.min(
                    10,
                    self.savedSettings.subtitle1TextShadowSize + 1
                  );
                  self.notify(
                    `Subtitle 1 Shadow: ${self.savedSettings.subtitle1TextShadowSize}`
                  );
                }
              } else {
                if (e.shiftKey) {
                  self.savedSettings.subtitle2FontSize = Math.min(
                    3.0,
                    self.savedSettings.subtitle2FontSize + 0.1
                  );
                  self.notify(
                    `Subtitle 2 size: ${self.savedSettings.subtitle2FontSize.toFixed(
                      1
                    )}`
                  );
                } else {
                  self.savedSettings.subtitle1FontSize = Math.min(
                    3.0,
                    self.savedSettings.subtitle1FontSize + 0.1
                  );
                  self.notify(
                    `Subtitle 1 size: ${self.savedSettings.subtitle1FontSize.toFixed(
                      1
                    )}`
                  );
                }
              }
              break;
            case "-":
              if (eitherNG) return;
              stopEvent(e);
              self.savedSettings.subtitle1FontSize = Math.max(
                self.savedSettings.subtitle1FontSize - 0.15,
                0.5
              );
              self.savedSettings.subtitle2FontSize = Math.max(
                self.savedSettings.subtitle2FontSize - 0.15,
                0.5
              );
              self.notify(
                `Font sizes decreased: ${self.savedSettings.subtitle1FontSize.toFixed(
                  1
                )}/${self.savedSettings.subtitle2FontSize.toFixed(1)}`
              );
              break;
            case "=":
              if (eitherNG) return;
              stopEvent(e);
              self.savedSettings.subtitle1FontSize = Math.min(
                self.savedSettings.subtitle1FontSize + 0.15,
                3.0
              );
              self.savedSettings.subtitle2FontSize = Math.min(
                self.savedSettings.subtitle2FontSize + 0.15,
                3.0
              );
              self.notify(
                `Font sizes increased: ${self.savedSettings.subtitle1FontSize.toFixed(
                  1
                )}/${self.savedSettings.subtitle2FontSize.toFixed(1)}`
              );
              break;
            case "l":
            case "L":
              if (eitherNG) return;
              stopEvent(e);
              self.isMaxLinesMode = !self.isMaxLinesMode;
              self.notify(
                `Max caption lines: ${
                  self.isMaxLinesMode ? "Unlimited" : self.maxCaptionLines
                }`
              );
              break;
            case "z":
            case "Z":
              if (eitherNG) return;
              stopEvent(e);
              self.savedSettings.subtitleDelay = Math.max(
                -10.0,
                self.savedSettings.subtitleDelay - 0.1
              );
              self.notify(
                `Subtitle delay: ${self.savedSettings.subtitleDelay.toFixed(
                  1
                )}s`
              );
              break;
            case "x":
            case "X":
              if (eitherNG) return;
              stopEvent(e);
              self.savedSettings.subtitleDelay = Math.min(
                10.0,
                self.savedSettings.subtitleDelay + 0.1
              );
              self.notify(
                `Subtitle delay: ${self.savedSettings.subtitleDelay.toFixed(
                  1
                )}s`
              );
              break;

            case "Delete":
              if (eitherNG) return;
              stopEvent(e);
              if (e.shiftKey) {
                // Shift+Delete: Delete all active captions
                if (!self.activeCaptions || self.activeCaptions.length === 0) {
                  self.notify("No active captions to delete");
                  break;
                }
                // Delete all active captions
                var idsToDelete = [];
                self.activeCaptions.forEach(function (caption) {
                  if (
                    self.savedSettings.deletedCaptionIds.indexOf(caption.id) ===
                    -1
                  ) {
                    idsToDelete.push(caption.id);
                  }
                });

                if (idsToDelete.length > 0) {
                  self.savedSettings.deletedCaptionIds =
                    self.savedSettings.deletedCaptionIds.concat(idsToDelete);
                  self.notify(`Deleted ${idsToDelete.length} captions`);
                  self.$forceUpdate();
                } else {
                  self.notify("No new captions to delete");
                }
              } else {
                // Delete: Delete only the first caption
                if (!self.activeCaptions || self.activeCaptions.length === 0) {
                  self.notify("No active captions to delete");
                  break;
                }
                var idToDelete = self.activeCaptions[0].id;
                // Add to deleted IDs if not already there
                if (
                  self.savedSettings.deletedCaptionIds.indexOf(idToDelete) ===
                  -1
                ) {
                  self.savedSettings.deletedCaptionIds.push(idToDelete);
                  self.notify("Deleted first caption");
                  self.$forceUpdate();
                } else {
                  self.notify("First caption already deleted");
                }
              }
              break;
            case "u":
            case "U":
              if (eitherNG) return;
              stopEvent(e);
              if (self.savedSettings.deletedCaptionIds.length > 0) {
                var restored = self.savedSettings.deletedCaptionIds.pop();
                self.notify(`Restored last deleted caption`);
                self.$forceUpdate();
              } else {
                self.notify("No deletions to undo");
              }
              break;

            case "m":
            case "M":
              if (videoNG) return;
              stopEvent(e);
              self.increasePlaybackSpeed(true);
              break;
            case "n":
            case "N":
              if (videoNG) return;
              stopEvent(e);
              self.increasePlaybackSpeed(false);
              break;
          }
        });
      },

      generateTextShadow: function (size) {
        if (!size || size <= 0) return "none";
        const s = parseInt(size, 10);
        if (isNaN(s) || s <= 0) return "none";

        let shadows = [];
        for (let i = 1; i <= s; i++) {
          shadows.push(`${-i}px ${-i}px 0 black`);
          shadows.push(`${i}px ${-i}px 0 black`);
          shadows.push(`${-i}px ${i}px 0 black`);
          shadows.push(`${i}px ${i}px 0 black`);
          shadows.push(`${-i}px 0 0 black`);
          shadows.push(`${i}px 0 0 black`);
          shadows.push(`0 ${-i}px 0 black`);
          shadows.push(`0 ${i}px 0 black`);
        }
        return shadows.join(", ");
      },

      calcAppStyle: function () {
        return this.calcGridTemplateAreas() + this.calcGridTemplateColumns();
      },

      calcGridTemplateAreas: function () {
        if (
          !this.videoUrl &&
          this.captionSources.length === 0 &&
          !this.shouldShowSubtitlesError
        ) {
          return "grid-template-areas: " + "'video video video' " + ";";
        }

        return "grid-template-areas: " + "'video resizeBar sidebar' " + ";";
      },

      calcGridTemplateColumns: function () {
        var leftWidth = this.sideBarX + this.sideBarDragDx;
        var middleWidth = 0;
        var rightWidth = 1 - leftWidth;
        var widths = [leftWidth, middleWidth, rightWidth];
        return (
          "grid-template-columns: " +
          widths
            .map(function (x) {
              return x * 100 + "%";
            })
            .join(" ") +
          ";"
        );
      },

      toggleOffsetMode: function () {
        this.isOffsetMode = !this.isOffsetMode;
      },

      onOffsetInputScroll: function (e) {
        if (e.target == document.activeElement) return;
        if (e.deltaY < 0) {
          this.subtitlesOffsetInput = (
            this.subtitlesOffsetSeconds + 0.1
          ).toFixed(1);
        } else if (e.deltaY > 0) {
          this.subtitlesOffsetInput = (
            this.subtitlesOffsetSeconds - 0.1
          ).toFixed(1);
        }
      },

      toggleTooltip: function () {
        this.shouldShowTooltip = !this.shouldShowTooltip;
      },

      toggleHelp: function () {
        this.shouldShowHelpPopup = !this.shouldShowHelpPopup;
      },

      enableHelpMode: function (mode) {
        this.helpMode = mode;
      },

      helpButtonClass: function (mode) {
        return "help-mode-tab" + (this.helpMode === mode ? " selected" : "");
      },

      hideCursor: function () {
        this.mouseTimer = null;
        this.cursorVisible = false;
      },

      showCursor: function () {
        if (this.mouseTimer) window.clearTimeout(this.mouseTimer);
        this.cursorVisible = true;
        this.mouseTimer = window.setTimeout(this.hideCursor, 5000);
      },

      onMouseDown: function (e) {
        this.textSelection = window.getSelection().toString();
      },

      onMouseMove: function (e) {
        this.showCursor();
        if (!this.isDraggingSidebar) {
          this.onMouseUp();
          return;
        }
        this.sideBarDragDx =
          this.pixelsToFraction(e.clientX) - this.sideBarDragStartX;
      },

      onMouseUp: function (e) {
        this.isDraggingSidebar = false;
        this.sideBarDragStartX = 0;
        this.sideBarX = this.sideBarX + this.sideBarDragDx;
        this.sideBarDragDx = 0;
      },

      onMouseOut: function (e) {
        mouseX = e.pageX;
        mouseY = e.pageY;
        if (
          mouseY >= 0 &&
          mouseY <= window.innerHeight &&
          mouseX >= 0 &&
          mouseX <= window.innerWidth
        )
          return;
        this.onMouseUp(null);
      },

      onResizeBarMouseDown: function (e) {
        this.isDraggingSidebar = true;
        this.sideBarDragStartX = this.pixelsToFraction(e.clientX);
      },

      onResizeBarClick: function (e) {
        if (this.resizeBarClick) {
          clearTimeout(this.click);
          this.toggleSidebar();
        }
        this.resizeBarClick = setTimeout(() => {
          this.resizeBarClick = undefined;
        }, 400);
      },

      toggleSidebar: function () {
        if (this.sideBarX <= 0.99) {
          this.previousSideBarX = this.sideBarX;
          this.sideBarX = 1.0;
        } else {
          this.sideBarX = Math.min(this.previousSideBarX, 0.9);
          var self = this;
          setTimeout(function () {
            if (self.activeCaptions && self.activeCaptions.length > 0)
              self.scrollToCaption(self.activeCaptions[0].id);
          }, 0);
        }
      },

      pixelsToFraction(numPixels) {
        return numPixels / this.$el.clientWidth;
      },

      onFileDragover: function (e) {
        this.isDraggingFile = true;
      },

      onFileDragleave: function (e) {
        this.isDraggingFile = false;
      },

      onFileDrop: function (e) {
        this.isDraggingFile = false;
        this.handleDroppedFiles(e.dataTransfer.files);
      },

      handleDroppedFiles: function (files) {
        for (var i = 0; i < files.length; i++) {
          var file = files[i];
          this.isCaptions(file)
            ? this.loadCaptions(file)
            : this.loadVideo(file);
        }
      },

      onFileBrowse: function (e) {
        const input = document.getElementById("ab-file-browse-input");
        input.click();
      },

      onFileInputChange: function (e) {
        const input = document.getElementById("ab-file-browse-input");
        const files = input.files;
        if (files && files.length > 0) this.handleDroppedFiles(files);
      },

      onInputKeyDown: function (event) {
        if (Utils.inputFocusKeys.indexOf(event.key) !== -1)
          event.stopPropagation();
      },

      loadVideo: function (file) {
        if (this.videoUrl) {
          URL.revokeObjectURL(this.videoUrl);
        }

        this.videoUrl = URL.createObjectURL(file);
        this.shouldShowVideoError = false;
        this.videoErrorMessage = null;
        this.videoFileName = file.name;
      },

      onVideoError: function (event) {
        this.shouldShowVideoError = true;
        this.videoErrorMessage = event.target.error.message;
      },

      onVideoFocus: function (event) {
        this.getVideoElement().blur();
      },

      onVideoClick: function (event) {
        this.clearSelection();
      },

      onVideoSeek: function (e) {
        this.currentTime = this.getCurrentTime();
        this.updateActiveCaptions();
        setTimeout(this.updateActiveCaptions.bind(this), 50);

        var videoElement = this.getVideoElement();
        if (videoElement) {
          setTimeout(function () {
            videoElement.focus();
          }, 10);
        }
      },

      updateActiveCaptions: function () {
        if (
          !this.activeCaptionSource ||
          !this.captions[this.activeCaptionSource]
        ) {
          this.activeCaptionIds = [];
          return;
        }

        var time = this.currentTime;
        var activeIds = this.captions[this.activeCaptionSource]
          .filter(function (caption) {
            return caption.startTime <= time && time <= caption.endTime;
          })
          .map(function (caption) {
            return caption.id;
          });

        this.activeCaptionIds = activeIds;
      },

      getVideoElement: function () {
        return this.$el.querySelector("#ab-video-element");
      },

      onTimeUpdate: function () {
        var oldActiveCaptionIds = this.activeCaptionIds.slice();
        this.currentTime = this.getCurrentTime();
        this.updateActiveCaptions();
        var newActiveCaptionIds = this.activeCaptionIds;

        var oldIdsSet = new Set(oldActiveCaptionIds);
        var newIdsSet = new Set(newActiveCaptionIds);

        if (
          oldActiveCaptionIds.length !== newActiveCaptionIds.length ||
          !oldActiveCaptionIds.every((id) => newIdsSet.has(id))
        ) {
          var removedCaptionIds = oldActiveCaptionIds.filter(
            (id) => !newIdsSet.has(id)
          );
          this.handleAutoPauseCaptionUpdate(removedCaptionIds);
        }

        console.log(
          "[DEBUG] onTimeUpdate - activeCaptions:",
          this.activeCaptions ? this.activeCaptions.length : "null"
        );
      },

      getCurrentTime: function () {
        var videoElement = this.getVideoElement();
        if (!videoElement) return 0;
        return (
          videoElement.currentTime + (this.savedSettings.subtitleDelay || 0)
        );
      },

      getTotalDuration: function () {
        var videoElement = this.getVideoElement();
        return videoElement ? videoElement.duration : 0;
      },

      setCurrentTime: function (time, shouldPlay) {
        try {
          var videoElement = this.getVideoElement();
          if (videoElement) {
            var videoTime = time - (this.savedSettings.subtitleDelay || 0);
            this.currentTime = time;
            videoElement.currentTime = videoTime;

            if (shouldPlay) {
              videoElement.play().catch((error) => {
                if (error.name !== "AbortError") {
                  console.error("Unexpected error during play:", error);
                }
              });
            } else {
              videoElement.pause();
            }
          }
        } catch (error) {
          console.warn("Error during setCurrentTime:", error);
        }

        this.lastPauseTime = time;
        this.skipNextAutoPause = false;
      },

      copySubtitle: function () {
        if (!this.activeCaptions) return;
        var helpertextarea = document.createElement("textarea");
        document.body.appendChild(helpertextarea);
        helpertextarea.value = this.activeCaptions
          .map(function (c) {
            return c.text.trim();
          })
          .join("\n");
        helpertextarea.select();
        document.execCommand("copy");
        this.clearSelection();
        document.body.removeChild(helpertextarea);
        this.notify("Copied current subtitle to clipboard");
      },

      clearSelection: function () {
        if (window.getSelection) window.getSelection().removeAllRanges();
        else if (document.selection) document.selection.empty();
      },

      playPause: function (e) {
        var video = this.getVideoElement();
        if (video.paused) {
          video.play();
          this.isPlaying = true;

          if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
          }

          this.autoSaveInterval = setInterval(() => {
            this.saveProgress();
          }, 2000);
        } else {
          this.pause();
        }
      },

      play: function () {
        var video = this.getVideoElement();
        if (video) {
          if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
          }

          const playPromise = video.play();

          if (playPromise !== undefined) {
            playPromise
              .then((_) => {
                this.isPlaying = true;
                this.autoSaveInterval = setInterval(() => {
                  this.saveProgress();
                }, 2000);
                this.saveProgress();
              })
              .catch((error) => {
                console.error("[ERROR] play - Playback failed:", error);
                video.controls = true;
              });
          } else {
            this.isPlaying = true;
            this.autoSaveInterval = setInterval(() => {
              this.saveProgress();
            }, 2000);
            this.saveProgress();
          }
        }
      },

      pause: function (e) {
        var video = this.getVideoElement();
        if (video.paused) return;
        video.pause();
        this.lastPauseTime = this.getCurrentTime();
        this.isPlaying = false;
      },

      idsToCaptions: function (ids) {
        if (!ids) return [];
        var self = this;
        return ids
          .map(function (id) {
            return self.allCaptionsMap[id];
          })
          .filter(function (caption) {
            return caption !== undefined;
          });
      },

      getCaptionsById: function (ids) {
        if (!ids || ids.length === 0) return [];

        var self = this;
        return ids
          .map(function (id) {
            for (var sourceId in self.captions) {
              var sourceCaptions = self.captions[sourceId];
              for (var i = 0; i < sourceCaptions.length; i++) {
                if (sourceCaptions[i].id === id) {
                  return sourceCaptions[i];
                }
              }
            }
            return undefined;
          })
          .filter(function (caption) {
            return caption !== undefined;
          });
      },

      getSourceName: function (sourceId) {
        if (!sourceId) return "Unknown";

        if (sourceId.includes(".")) {
          var name = sourceId.split(".").slice(0, -1).join(".");
          name = name.replace(/[_-]/g, " ");
          name = name
            .split(" ")
            .map(function (word) {
              return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(" ");
          return name;
        }

        if (sourceId.startsWith("subtitle_")) {
          return "Subtitle " + (this.captionSources.indexOf(sourceId) + 1);
        }

        return sourceId;
      },

      switchCaptionSource: function (sourceId) {
        if (this.captionSources.indexOf(sourceId) !== -1) {
          this.activeCaptionSource = sourceId;
          this.activeCaptionIds = [];
          this.clearAutoPauseCaptions();
          this.updateActiveCaptions();
        }
      },

      playCaption: function (caption) {
        if (!caption) return;

        this.setCurrentTime(caption.startTime + 0.0001, true);
        this.activeCaptionIds = [caption.id];
      },
      seek: function (seconds) {
        var videoElement = this.getVideoElement();
        if (!videoElement) return;
        var newTime = videoElement.currentTime + seconds;
        videoElement.currentTime = Math.max(
          0,
          Math.min(newTime, videoElement.duration)
        );
      },
      replayCaption: function () {
        const captions = this.activeCaptions;
        if (captions && captions.length > 0) {
          this.playCaption(captions[0]);
          return;
        }
        const source = this.activeCaptionSource;
        if (
          !source ||
          !this.captions[source] ||
          this.captions[source].length === 0
        )
          return;

        const time = this.currentTime;
        const pastCaptions = this.captions[source].filter(
          (c) => c.endTime < time
        );
        if (pastCaptions.length > 0) {
          const lastCaption = pastCaptions[pastCaptions.length - 1];
          if (time - lastCaption.endTime < 3) {
            this.playCaption(lastCaption);
          }
        }
      },
      previousCaption: function (e) {
        this.moveCaptionsBy(-1);
      },
      nextCaption: function (e) {
        this.moveCaptionsBy(1);
      },
      moveCaptionsBy: function (numCaptions) {
        const source = this.activeCaptionSource;
        if (
          !source ||
          !this.captions[source] ||
          this.captions[source].length === 0
        ) {
          this.seek(numCaptions > 0 ? 3 : -3);
          return;
        }

        const captions = this.captions[source];
        const time = this.currentTime;
        let targetCaption = null;

        if (numCaptions > 0) {
          // 'next'
          targetCaption = captions.find((c) => c.startTime > time + 0.1);
        } else {
          // 'previous'
          const candidates = captions.filter((c) => c.startTime < time - 0.1);
          if (candidates.length > 0) {
            targetCaption = candidates[candidates.length - 1];
          }
        }

        if (targetCaption) {
          this.playCaption(targetCaption);
        } else {
          this.seek(numCaptions > 0 ? 3 : -3);
        }
      },
      getCurrentCaption: function (time) {
        for (let caption of this.activeCaptions) {
          if (caption.startTime <= time && time <= caption.endTime) {
            return caption;
          }
        }
        return null;
      },

      findNeighboringCaptionByOffset: function (caption, offset) {
        return this.allCaptionsMap[
          "id_" + (parseInt(caption.id.replace("id_", "")) + offset)
        ];
      },

      shiftVideoTime: function (numShifts) {
        var newTime =
          this.currentTime + numShifts * this.captionMoveLimitSeconds;
        this.setTimeWithinBounds(newTime);
      },

      setTimeWithinBounds: function (time) {
        this.setCurrentTime(
          Math.min(Math.max(time, 0.0), this.getTotalDuration() - 0.1),
          true
        );
      },

      tooFarAway: function (currentTime, nextCaption, numCaptionsMovingBy) {
        if (numCaptionsMovingBy > 0) {
          return (
            Math.abs(currentTime - nextCaption.startTime) >
            this.captionMoveLimitSeconds
          );
        } else {
          return (
            Math.abs(currentTime - nextCaption.endTime) >
            this.captionMoveLimitSeconds
          );
        }
      },

      seekXSeconds: function (seconds) {
        var isPositive = seconds >= 0;
        var startCaption = isPositive
          ? this.activeCaptions[this.activeCaptions.length - 1]
          : this.activeCaptions[0];
        if (!startCaption) startCaption = this.captions[0];
        var currentTime = this.getVideoElement().currentTime;
        var nextTime = currentTime + seconds;

        if (startCaption)
          this.selectCaptionClosestToNextTime(
            startCaption,
            nextTime,
            isPositive
          );

        this.setTimeWithinBounds(nextTime);
      },

      selectCaptionClosestToNextTime: function (
        startCaption,
        nextTime,
        isPositive
      ) {
        var self = this;
        var current = startCaption;
        var getNext = function () {
          return self.findNeighboringCaptionByOffset(
            current,
            isPositive ? 1 : -1
          );
        };
        var containsNextTime = function (caption) {
          return caption.startTime < nextTime && nextTime <= caption.endTime;
        };
        var next = getNext();
        var maxToScan = 100;
        for (var i = 0; i < maxToScan && next; i++) {
          if (containsNextTime(current) && !containsNextTime(next)) break;
          if (
            (isPositive && nextTime < next.startTime) ||
            (!isPositive && next.endTime < nextTime)
          )
            break;
          current = next;
          var next = getNext();
        }

        this.activeCaptionIds = [current.id];
      },

      seekScreenshot: function (numCaptions, shouldAutoCopy) {
        if (!this.captions || !this.captions.length === 0) return;

        var currentCaption;
        if (!this.activeCaptions || this.activeCaptions.length === 0)
          currentCaption = this.captions[0];
        else
          currentCaption =
            numCaptions > 0
              ? this.activeCaptions[this.activeCaptions.length - 1]
              : this.activeCaptions[0];

        var nextCaption = currentCaption;

        // Only move to a neighboring caption if we're already past or around the center of the current caption
        var currentCenter = this.calculateCaptionCenter(currentCaption);
        var centerRadius = Math.max(
          0.25,
          (currentCaption.startTime - currentCaption.endTime) / 8
        );
        if (
          (numCaptions < 0 &&
            this.currentTime < currentCenter + centerRadius) ||
          (numCaptions > 0 && currentCenter - centerRadius < this.currentTime)
        ) {
          nextCaption = this.findNeighboringCaptionByOffset(
            nextCaption,
            numCaptions
          );
        }

        var nextCenter = this.calculateCaptionCenter(nextCaption);
        this.setCurrentTime(nextCenter, false);
        this.activeCaptionIds = [nextCaption.id];
        this.clearAutoPauseCaptions();

        if (shouldAutoCopy) {
          this.scheduledImageCopies = Math.min(
            10,
            this.scheduledImageCopies + 1
          );
          setTimeout(this.onVideoSeek, 1000);
        }
      },

      calculateCaptionCenter: function (caption) {
        return (caption.startTime + caption.endTime) / 2;
      },

      copyImage: function () {
        var video = this.getVideoElement();
        if (!video) return;
        var canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (typeof ClipboardItem === "undefined") {
          this.notify(
            "Failed to copy screenshot to clipboard. Browser doesn't support ClipboardItem."
          );
          return;
        }

        this.copyImageChrome(canvas);
        // Whatever frame the video pauses on becomes weirdly pixelated after drawing to the canvas context,
        // so shake it back and forth to make the video smooth again
        video.currentTime = video.currentTime + 0.00001;
        video.currentTime = video.currentTime - 0.00001;
      },

      copyImageChrome: function (canvas) {
        var self = this;
        canvas.toBlob(function (blob) {
          try {
            navigator.clipboard
              .write([
                new ClipboardItem({
                  [blob.type]: blob,
                }),
              ])
              .then(
                function () {
                  self.notify("Copied screenshot to clipboard");
                },
                function (e) {
                  self.notify("Failed to copy screenshot to clipboard: " + e);
                }
              );
          } catch (e) {
            self.notify("Failed to copy screenshot to clipboard: " + e);
          }
        });
      },

      notify: function (text) {
        var self = this;
        self.notifyText = text;
        self.notifyCount = Math.min(5, self.notifyCount + 1);
        setTimeout(function () {
          self.notifyCount = Math.max(0, self.notifyCount - 1);
        }, 1000);
      },

      selectCaption: function (caption, offset) {
        var previousTextSelection = this.textSelection || "";
        try {
          var selection = window.getSelection();
          this.textSelection =
            selection && selection.rangeCount > 0 ? selection.toString() : "";
        } catch (e) {
          console.warn("Error getting text selection:", e);
          this.textSelection = "";
        }

        if (
          this.textSelection &&
          this.textSelection.length > 0 &&
          this.textSelection !== previousTextSelection
        ) {
          return;
        }

        if (this.isOffsetMode) {
          this.subtitlesOffsetInput = (
            this.subtitlesOffsetSeconds + offset
          ).toFixed(2);
          this.isOffsetMode = false;
        } else {
          this.setCurrentTime(caption.startTime + 0.0001, true);
        }
      },

      setCustomOffset: function (caption, offset) {
        var currentOffset = caption.customOffset || 0.0;
        var newOffset = (currentOffset + offset).toFixed(2);
        this.$set(this.customOffsets, caption.id, newOffset);
        this.isOffsetMode = false;
        setTimeout(function () {
          var el = document.getElementById("custom_offset_" + caption.id);
          if (el) el.focus();
        }, 0);
      },

      getTrack: function () {
        var videoElement = this.getVideoElement();
        if (
          !videoElement ||
          !videoElement.textTracks ||
          videoElement.textTracks.length === 0
        )
          return null;
        var track = videoElement.textTracks[0];
        if (track.mode !== "showing") track.mode = "showing";
        return track;
      },

      enableAudioTrack: function (audioTrackIndex) {
        for (var i = 0; i < this.audioTracks.length; i++)
          this.audioTracks[i].enabled = false;
        this.audioTracks[audioTrackIndex].enabled = true;
      },

      addRegexReplacement: function () {
        this.savedSettings.regexReplacements.push({
          regex: "",
          replaceText: "",
        });
      },

      removeRegexReplacement: function (index) {
        this.savedSettings.regexReplacements.splice(index, 1);
      },

      hideRegexMatches: function (captions) {
        var replacements = this.savedSettings.regexReplacements;
        for (var i = 0; i < replacements.length; i++) {
          try {
            var regex = new RegExp(replacements[i].regex, "g");
            var replaceText = replacements[i].replaceText;
            captions.forEach(function (caption) {
              caption.text = caption.text.replace(regex, replaceText);
            });
          } catch (e) {
            continue;
          }
        }
      },

      handleAutoPauseCaptionUpdate: function (removedCaptionIds) {
        this.handleAutoPause(this.getCurrentTime(), removedCaptionIds);
      },

      handleAutoPauseTimeUpdate: function (newTime) {
        if (this.isPlaying) this.clearAutoPauseCaptions();

        if (newTime < this.lastPauseTime) this.lastPauseTime = newTime;

        this.handleAutoPause(newTime, []);
      },

      handleAutoPause: function (time, removedCaptionIds) {
        if (
          !this.isAutoPauseMode ||
          !this.activeCaptions ||
          this.activeCaptions.length === 0
        )
          return;

        var self = this;
        var nextCaption = this.findNeighboringCaptionByOffset(
          this.activeCaptions[this.activeCaptions.length - 1],
          1
        );
        var shouldBeAutoPaused = function (caption) {
          var buffer = self.autoPauseMaxBufferSeconds;
          if (removedCaptionIds.indexOf(caption.id) !== -1) buffer = 0;
          else if (nextCaption && caption.endTime < nextCaption.startTime) {
            var nonVoicedSpace = nextCaption.startTime - caption.endTime;
            buffer = nonVoicedSpace - self.preCaptionAutoPauseNet;
            buffer = Math.max(
              0,
              Math.min(buffer, self.autoPauseMaxBufferSeconds)
            );
          }

          return (
            caption.endTime + buffer < time && self.captionHasPlayed(caption)
          );
        };

        if (this.activeCaptions.some(shouldBeAutoPaused)) {
          if (this.skipNextAutoPause) {
            this.skipNextAutoPause = false;
            this.lastPauseTime = time;
            return;
          }
          this.autoPauseCaptions = this.activeCaptions;
          this.pause();
          // Set up auto-save every 2 seconds
          this.autoSaveInterval = setInterval(() => {
            this.saveProgress();
          }, 2000);
        }
      },

      captionHasPlayed: function (caption) {
        var captionLength = Math.abs(caption.endTime - caption.startTime);
        var minSecondsNeeded = Math.min(0.3, captionLength - 0.01);
        var secondsNeededToHavePlayed = Math.max(
          minSecondsNeeded,
          captionLength * this.minimumPercentNeededToPlayBeforeAutoPause
        );
        return this.lastPauseTime < caption.endTime - secondsNeededToHavePlayed;
      },

      clearAutoPauseCaptions: function () {
        if (this.autoPauseCaptions.length > 0) this.autoPauseCaptions = [];
      },

      scrollToCaption: function (captionId) {
        var el = this.$el.querySelector("#" + captionId);
        if (el.scrollIntoViewIfNeeded) el.scrollIntoViewIfNeeded(true);
        else el.scrollIntoView({ behavior: "smooth", block: "center" });
      },

      isCaptions: function (file) {
        return /\.(vtt|srt|ass|ssa)$/i.test(file.name);
      },
      loadCaptions: function (file) {
        this.subtitlesFileName = file.name;
        var self = this;
        var reader = new FileReader();
        reader.onload = function (e) {
          var content = e.target.result;
          var sourceId = file.name;

          self.$set(self.subtitleContents, sourceId, content);

          if (self.captionSources.indexOf(sourceId) === -1) {
            self.captionSources.push(sourceId);
            self.subtitleOrder.push(sourceId);
          }

          if (!self.activeCaptionSource) {
            self.activeCaptionSource = sourceId;
          }

          self.processAllSubtitles();

          if (self.sideBarX > 0.99) {
            self.toggleSidebar();
          }
        };
        reader.readAsText(file);
      },

      stripHtml: function (line) {
        var doc = new DOMParser().parseFromString(line, "text/html");
        return doc.body.textContent || "";
      },

      assToCaptions: function (text) {
        var self = this;
        var reAss = new RegExp(
          "Dialogue:\\s\\d," + // get time and subtitle
            "(\\d+:\\d\\d:\\d\\d.\\d\\d)," + // start time
            "(\\d+:\\d\\d:\\d\\d.\\d\\d)," + // end time
            "([^,]*)," + // object
            "([^,]*)," + // actor
            "(?:[^,]*,){4}" +
            "(.*)$", // subtitle
          "i"
        );
        var reTime = /(\d+):(\d\d):(\d\d).(\d\d)/;
        var reStyle = /\{([^}]+)\}/g;

        var getSeconds = function (timeStr) {
          var match = timeStr.match(reTime);
          return (
            Math.round(
              parseInt(match[1], 10) * 60 * 60 * 1000 +
                parseInt(match[2], 10) * 60 * 1000 +
                parseInt(match[3], 10) * 1000 +
                parseInt(match[4], 10) * 10
            ) / 1000
          );
        };

        var removeStyle = function (line) {
          var parts = line.split(reStyle);
          var isDrawingMode = false;
          var spokenText = "";
          for (var i = 0; i < parts.length; i++) {
            if (i % 2 == 0) {
              if (!isDrawingMode) {
                spokenText += parts[i];
              }
            } else {
              // \p1 starts drawing mode, \p0 ends it
              // But, \p2,\p3,\p4,\p5,... also start drawing mode (with different resolutions)
              // so you have to account for those too.
              var found = parts[i].match(/\\p\d/g);
              if (found) {
                if (found[0] == "p0") {
                  isDrawingMode = false;
                } else {
                  isDrawingMode = true;
                }
              }
            }
          }
          return spokenText.replace(/\\N/gi, "\n").trim();
        };

        var lines = text.split(/[\n\r]+/g);
        var captions = lines
          .map(function (line, index) {
            var match = line.match(reAss);
            if (!match) {
              return null;
            }
            return {
              id: index + 1,
              startTime: getSeconds(match[1]),
              endTime: getSeconds(match[2]),
              text: self.stripHtml(removeStyle(match[5])),
              voice: match[3] && match[4] ? match[3] + " " + match[4] : "",
            };
          })
          .filter(function (caption) {
            return caption != null;
          });

        return captions.length ? captions : null;
      },

      srtToCaptions: function (text) {
        var self = this;
        text = text.replace(/\r/g, "");
        var reTime = /(\d\d):(\d\d):(\d\d),(\d\d\d)/;

        if (!reTime.test(text)) {
          return null;
        }

        var getSeconds = function (timeStr) {
          var match = timeStr.match(reTime);
          return (
            Math.round(
              parseInt(match[1], 10) * 60 * 60 * 1000 +
                parseInt(match[2], 10) * 60 * 1000 +
                parseInt(match[3], 10) * 1000 +
                parseInt(match[4], 10)
            ) / 1000
          );
        };

        var entries = text.split(/\n[\n]+(?=[0-9]+\n)/g);
        var captions = entries
          .map(function (entry) {
            var lines = entry.split(/\n+/g);
            if (lines.length < 3) {
              return null;
            }
            var timestamps = lines[1].split(/\s*-->\s*/);
            var text = self.stripHtml(
              lines
                .slice(2)
                .join("\n")
                .replace(/\{\\an[0-9]{1,2}\}/g, "")
            );
            return {
              id: lines[0],
              startTime: getSeconds(timestamps[0]),
              endTime: getSeconds(timestamps[1]),
              text: text,
            };
          })
          .filter(function (caption) {
            return caption != null;
          });

        return captions.length ? captions : null;
      },

      vttToCaptions: function (text) {
        var self = this;
        if (text.indexOf("WEBVTT") !== 0) return null;

        text = text.replace(/\r/g, "");
        var reTime = /(\d\d):(\d\d):(\d\d).(\d\d\d)/;
        var reTimeNoHours = /()(\d\d):(\d\d).(\d\d\d)/;

        var hasTimeStamp = function (text) {
          return reTime.test(text) || reTimeNoHours.test(text);
        };

        if (!hasTimeStamp(text)) {
          return null;
        }

        var getSeconds = function (timeStr) {
          var match = timeStr.match(reTime);
          if (!match) match = timeStr.match(reTimeNoHours);
          return (
            Math.round(
              (match[1] ? parseInt(match[1], 10) * 60 * 60 * 1000 : 0) +
                parseInt(match[2], 10) * 60 * 1000 +
                parseInt(match[3], 10) * 1000 +
                parseInt(match[4], 10)
            ) / 1000
          );
        };

        var entries = text.split(/\n[\n]+/g);
        var captions = entries
          .map(function (entry) {
            if (!hasTimeStamp(entry)) return null;

            var entryId = null;
            var lines = entry.split(/\n+/g);

            if (lines.length > 0 && !hasTimeStamp(lines[0])) {
              entryId = lines[0];
              lines = lines.slice(1, lines.length);
            }
            if (lines.length < 2) return null;

            var timestamps = lines[0].split(/\s*-->\s*/);
            return {
              id: entryId,
              startTime: getSeconds(timestamps[0]),
              endTime: getSeconds(timestamps[1]),
              text: self.stripHtml(lines.slice(1).join("\n")),
            };
          })
          .filter(function (caption) {
            return caption != null;
          });

        return captions.length ? captions : null;
      },

      formatVtt: function (captions) {
        if (!captions) return null;

        var padWithZeros = function (num, digits) {
          return ("0000" + num).slice(-digits);
        };

        var formatTime = function (seconds) {
          var date = new Date(2000, 0, 1, 0, 0, 0, seconds * 1000);
          return [
            padWithZeros(date.getHours(), 2),
            padWithZeros(date.getMinutes(), 2),
            padWithZeros(date.getSeconds(), 2) +
              "." +
              padWithZeros(date.getMilliseconds(), 3),
          ].join(":");
        };

        var lines = captions.map(function (caption) {
          return [
            caption.id,
            formatTime(caption.startTime, true) +
              " --> " +
              formatTime(caption.endTime, true),
            (caption.voice ? "<v " + caption.voice + ">" : "") + caption.text,
          ].join("\n");
        });

        return "WEBVTT\n\n" + lines.join("\n\n");
      },

      formatSrt: function (captions) {
        if (!captions) return null;

        var padWithZeros = function (num, digits) {
          return ("0000" + num).slice(-digits);
        };

        var formatTime = function (seconds) {
          var date = new Date(2000, 0, 1, 0, 0, 0, Math.max(0, seconds) * 1000);
          return [
            padWithZeros(date.getHours(), 2),
            padWithZeros(date.getMinutes(), 2),
            padWithZeros(date.getSeconds(), 2) +
              "," +
              padWithZeros(date.getMilliseconds(), 3),
          ].join(":");
        };

        var lines = captions.map(function (caption, index) {
          return [
            index + 1,
            formatTime(caption.startTime, true) +
              " --> " +
              formatTime(caption.endTime, true),
            (caption.voice ? "(" + caption.voice + ") " : "") + caption.text,
          ].join("\n");
        });

        return lines.join("\n\n");
      },
      ruby: function (arr, sourceId, index) {
        if (
          !sourceId ||
          !this.captions[sourceId] ||
          !this.captions[sourceId][index]
        ) {
          return;
        }
        if (!arr || !arr.length) {
          const text = this.captions[sourceId][index].text;
          if (text && !text.includes("<p>") && !isJapanese(text)) {
            this.captions[sourceId][index].text = `<p>${text}</p>`;
          }
          return;
        }

        if (this.captions[sourceId][index].text.includes("<ruby")) {
          return;
        }

        let processedText = "";

        for (let t of arr) {
          try {
            let kj, kn, token;
            if (Array.isArray(t)) {
              kj = t[0];
              kn = t[1];
              token = t[2];
            } else {
              kj = String(t);
              kn = "";
              token = null;
            }
            if (!kj) continue;
            kn = kj === kn ? "" : kn;

            if (!isJapanese(kj)) {
              processedText += kj;
              continue;
            }

            let wordType = getWordType(token, kj);

            let kja = kj.split("");
            let kna = kn.split("");
            let okurigana = [];
            while (
              kja.length > 0 &&
              kna.length > 0 &&
              kja[kja.length - 1] === kna[kna.length - 1]
            ) {
              okurigana.unshift(kja.pop());
              kna.pop();
            }
            const rubyBase = kja.join("");
            const rubyText = kna.join("");
            const okuriganaStr = okurigana.join("");

            const colorStyle =
              wordType !== "default" && colorMap[wordType]
                ? ` style="color:${colorMap[wordType]}"`
                : "";

            if (rubyText && rubyBase) {
              processedText += `<ruby${colorStyle}>${rubyBase}<rt>${rubyText}</rt></ruby>${okuriganaStr}`;
            } else {
              const word = rubyBase + okuriganaStr;
              processedText += colorStyle
                ? `<span${colorStyle}>${word}</span>`
                : word;
            }
          } catch (e) {
            console.error("Error processing furigana token:", t, e);
            const text = Array.isArray(t) ? t[0] : String(t);
            processedText += text;
          }
        }

        this.captions[sourceId][index].text = processedText;
      },
      furigana: async function (sourceId, limit = 50) {
        try {
          if (!sourceId && this.activeCaptionSource) {
            sourceId = this.activeCaptionSource;
          }

          if (!sourceId || !this.captions || !this.captions[sourceId]) {
            return;
          }

          tokenizer = await initializeTokenizer();
          const promises = [];
          const captionsArray = this.captions[sourceId];

          if (!Array.isArray(captionsArray)) {
            return;
          }

          for (let i = 0; i < captionsArray.length; i++) {
            try {
              if (!captionsArray[i] || !captionsArray[i].text) {
                continue;
              }

              const text = captionsArray[i].text;

              const promise = makeFurigana(text)
                .then((arr) => {
                  this.ruby(arr, sourceId, i);
                })
                .catch((error) => {
                  console.error(
                    "Error in makeFurigana for caption",
                    i,
                    ":",
                    error
                  );
                });
              promises.push(promise);
            } catch (e) {
              console.error(e);
            }
          }
        } catch (e) {
          console.error(e);
          console.trace();
        }
      },
      fileToCaptions: function (text, offset, customOffsets) {
        var parsed =
          this.vttToCaptions(text) ||
          this.assToCaptions(text) ||
          this.srtToCaptions(text);
        if (!parsed) return null;

        this.sortCaptionsByTime(parsed);
        this.mergeDuplicates(parsed);
        var currentOffset = offset;
        for (var i = 0; i < parsed.length; i++) {
          var caption = parsed[i];
          caption.id = "id_" + i;
          if (customOffsets.hasOwnProperty(caption.id)) {
            caption.customOffset = Utils.parseInputNum(
              customOffsets[caption.id]
            );
            if (i > 0) {
              var guaranteedGapBetweenLines = 0.002;
              var minCustomOffset =
                parsed[i - 1].startTime -
                caption.startTime -
                currentOffset +
                guaranteedGapBetweenLines;
              caption.customOffset = Math.max(
                caption.customOffset,
                minCustomOffset
              );
              caption.minCustomOffset = minCustomOffset;
            } else {
              caption.minCustomOffset = null;
            }
            currentOffset += caption.customOffset;
          } else {
            caption.customOffset = null;
          }
          caption.startTime = caption.startTime + currentOffset;
          caption.endTime = caption.endTime + currentOffset;
          caption.isActive = false;
        }

        this.assignCaptionsToLanes(parsed);
        if (this.shouldHideRegexMatches) this.hideRegexMatches(parsed);
        console.warn(parsed);
        return parsed;
      },

      sortCaptionsByTime: function (captions) {
        captions.sort(function (a, b) {
          if (a.startTime === b.startTime) {
            if (a.endTime === b.endTime) {
              return 0;
            }
            return a.endTime > b.endTime ? 1 : -1;
          }
          return a.startTime > b.startTime ? 1 : -1;
        });
      },

      mergeDuplicates: function (captions) {
        var duplicateIndexes = [];
        for (var i = 0; i < captions.length - 1; i++) {
          var caption = captions[i];
          var nextCaption = captions[i + 1];
          if (
            caption.text === nextCaption.text &&
            this.isOverlapping(caption, nextCaption)
          ) {
            nextCaption.startTime = Math.min(
              caption.startTime,
              nextCaption.startTime
            );
            nextCaption.endTime = Math.max(
              caption.endTime,
              nextCaption.endTime
            );
            duplicateIndexes.push(i);
          } else if (
            caption.startTime === nextCaption.startTime &&
            caption.endTime === nextCaption.endTime
          ) {
            nextCaption.text = caption.text + "\n" + nextCaption.text;
            duplicateIndexes.push(i);
          }
        }

        for (var i = duplicateIndexes.length - 1; i >= 0; i--)
          captions.splice(duplicateIndexes[i], 1);
      },

      // Kinda over-engineered, but this is what makes sure that overlapping captions
      // can appear simultaneously without the second caption shifting to the bottom
      // in case the first caption finishes first.
      assignCaptionsToLanes: function (captions) {
        for (var i = 0; i < captions.length; i++) {
          var caption = captions[i];
          var previousCaptions = this.findPreviousCaptions(
            captions,
            caption,
            i
          );

          var self = this;
          var takenLanes = previousCaptions
            .filter(function (prev) {
              return self.isOverlapping(prev, caption);
            })
            .map(function (c) {
              return c.lane;
            });

          for (var lane = 0; lane < takenLanes.length + 1; lane++) {
            if (takenLanes.indexOf(lane) === -1) {
              caption.lane = lane;
              break;
            }
          }

          if (!caption.lane) caption.lane = 0;

          caption.neededNewlines = this.calculateNeededNewlines(
            caption,
            previousCaptions
          );
        }
      },

      calculateNeededNewlines: function (caption, previousCaptions) {
        if (caption.lane === 0) {
          return 0;
        } else {
          var captionsBelow = previousCaptions.filter(function (prevCap) {
            return prevCap.lane < caption.lane;
          });

          var self = this;
          var newlinesByLane =
            captionsBelow.reduce(function (map, caption) {
              var newlines = self.newlineCount(caption.text);
              if (!map.hasOwnProperty(caption.lane))
                map[caption.lane] = newlines;
              else map[caption.lane] = Math.max(newlines, map[caption.lane]);
              return map;
            }, {}) || {};

          var newlineCounts = Object.values(newlinesByLane);
          return (
            newlineCounts.reduce(function (a, b) {
              return a + b;
            }, 0) + newlineCounts.length
          );
        }
      },

      newlineCount: function (text) {
        return (text.match(/\n/g) || []).length;
      },

      // If 2 subtitles only overlap for like a few milliseconds, I don't
      // want the second subtitle to float in mid-air; I'd rather just show the
      // second one when the first one is finished.
      isOverlapping: function (leftCaption, rightCaption) {
        var rightContainedDuration =
          leftCaption.endTime - rightCaption.startTime;
        var rightDuration = rightCaption.endTime - rightCaption.startTime;
        return (
          rightContainedDuration > 0.2 ||
          rightContainedDuration / rightDuration > 0.3
        );
      },

      findPreviousCaptions: function (captions, currentCaption, index) {
        var previousCaptions = [];
        var previousCaptionLanes = {};
        var maxLookBehind = 5;
        var misses = 0;
        for (var j = index - 1; j >= 0; j--) {
          var prevCaption = captions[j];
          if (
            prevCaption.lane in previousCaptionLanes &&
            !(
              prevCaption.startTime < currentCaption.startTime &&
              currentCaption.startTime < prevCaption.endTime
            )
          ) {
            misses++;
            if (misses > maxLookBehind) break;
            else continue;
          }

          previousCaptions.push(prevCaption);
          previousCaptionLanes[prevCaption.lane] = true;
        }

        previousCaptions.sort(this.compareByLane);

        return previousCaptions;
      },

      compareByLane: function (a, b) {
        return a.lane == b.lane ? 0 : a.lane > b.lane ? 1 : -1;
      },

      increasePlaybackSpeed: function (increase) {
        var videoElement = this.getVideoElement();
        var speed = videoElement.playbackRate;
        speed += increase ? 0.05 : -0.05;
        speed = parseFloat(speed).toFixed(2);
        if (speed > 3) speed = 3;
        else if (speed < 0.25) speed = 0.25;

        videoElement.playbackRate = speed;
        this.notify(`Playback speed changed to ${speed}`);
      },

      downloadString: function (text, fileType, fileName) {
        var blob = new Blob([text], { type: fileType });
        var a = document.createElement("a");
        a.download = fileName;
        a.target = "_blank";
        a.href = URL.createObjectURL(blob);
        a.dataset.downloadurl = [fileType, a.download, a.href].join(":");
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () {
          URL.revokeObjectURL(a.href);
        }, 1500);
      },
    },
  });

  return vm;
}

console.log(
  "Creating app Date: " +
    new Date().toISOString().replace("T", " ").replace("Z", "")
);
createApp();
