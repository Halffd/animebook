var API_URL = 'http://127.0.0.1:5000'; // Replace with your API URL

// Enable CORS for all routes
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': true
};
// Helper function to set CORS headers
function setCorsHeaders(res) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}
var util
var mod
var aDict
var analyze
var wn = console.warn
var subtitlesFileContent

function toggleControls() {
    const video = document.getElementById('ab-video-element');
    const styleId = 'hide-video-controls';
    let existingStyle = document.getElementById(styleId);

    if (existingStyle) {
        // Controls are hidden, show them
        existingStyle.remove();
        video.dataset.controlsHidden = 'false';
    } else {
        // Controls are visible, hide them
        const style = document.createElement('style');
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
        video.dataset.controlsHidden = 'true';
    }
    }

    // Check if controls are currently hidden
    function areControlsHidden() {
    const video = document.getElementById('ab-video-element');
    return video.dataset.controlsHidden === 'true';
    }

    // Hide controls initially
    function hideControls() {
    const video = document.getElementById('ab-video-element');
    if (!areControlsHidden()) {
        toggleControls();
    }
    }

    // Show controls
    function showControls() {
    const video = document.getElementById('ab-video-element');
    if (areControlsHidden()) {
        toggleControls();
    }
    }
const colorMap = {
    particle: '#ff69b4', // pink
    kanji: '#6969ff',    // blue
    kana: '#32ed32',     // green
    default: '#ffffff',  // white
};

// Function to check if text contains Japanese characters
function isJapanese(text) {
    if (!text) return false;
    return /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(text);
}

// Function to check if a character is a Japanese particle
function isParticleChar(char) {
    const particles = ['は', 'が', 'を', 'に', 'で', 'と', 'へ', 'も', 'や', 'の', 'から', 'まで', 'か', 'よ', 'ね', 'さ', 'わ', 'な', 'ぞ', 'ぜ', 'とも', 'かしら', 'っけ', 'の', 'ん', 'もの', 'こと', 'ばかり', 'だけ', 'ほど', 'くらい', 'など', 'やら', 'か', 'だの', 'だに', 'すら', 'さえ', 'でも', 'こそ', 'しか', 'ばかり', 'まで', 'ばかり', 'ほど', 'くらい', 'など', 'やら', 'か', 'だの', 'だに', 'すら', 'さえ', 'でも', 'こそ', 'しか'];
    return particles.includes(char);
}

function getWordType(kj, kn) {
    if (!kj) return 'default';
    
    // Check for particles first
    if (kj.length === 1 && isParticleChar(kj)) {
        return 'particle';
    }
    
    const isKana = (s) => /^[\u3040-\u309F\u30A0-\u30FFー]+$/.test(s);
    const isKanji = (s) => /[\u4e00-\u9faf]/.test(s);
    
    // Check for particles in the text
    for (let i = 0; i < kj.length; i++) {
        if (isParticleChar(kj[i])) {
            return 'particle';
        }
    }
    
    if (isKanji(kj)) return 'kanji';
    if (isKana(kj)) return 'kana';
    return 'default';
}
function stripRubyTags(html) {
    return html.replace(/<ruby>|<\/ruby>|<rt>.*?<\/rt>/g, '');
}

// Handle file uploads
async function handleFileUpload(files, path = '') {
  const formData = new FormData();
  Array.from(files).forEach(file => {
    formData.append('files', file);
  });
  
  if (path) {
    formData.append('path', path);
  }
  
  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
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
        size: file.size
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
            'ArrowLeft',
            'ArrowUp',
            'ArrowDown',
            'ArrowRight',
            '.',
            '-',
            '='
        ]
    }
    Vue.component('caption-item', {
        props: ['caption', 'customOffsets', 'isAutoPauseMode', 'isOffsetMode', 'currentTime'],
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
                return 'caption button' +
                    (caption.isActive ? ' active' : '') +
                    (this.isAutoPauseMode ? ' auto-pause' : '');
            },
            selectCaption: function (caption) {
                this.$emit('select-caption', caption, this.calcCaptionOffset(caption))
            },
            // Only use getSourceName for UI display, not for caption text
            getCaptionText: function(caption) {
                if (!caption) return '';
                return caption.text || '';
            },
            displaySidebarCaption: function (caption) {
                var text = this.getCaptionText(caption);
                return "\n" + text.split("\n").map(Utils.wrapInP).join("");
            },
            displayCaptionOffset: function (caption) {
                var offset = this.calcCaptionOffset(caption);
                return '<span data-pseudo-content="' + (offset > 0 ? '+' : '') + this.calcCaptionOffset(caption).toFixed(2) + "s" + '"></span>';
            },
            setCustomOffset: function (caption) {
                this.$emit('set-custom-offset', caption, this.calcCaptionOffset(caption))
            },
            calcCaptionOffset: function (caption) {
                return this.currentTime - caption.endTime;
            },
            newline: function () {
                return "\n"
            }
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
              `
    })

    Vue.component('caption-bar', {
        props: ['captions', 'captionSources', 'activeCaptionSource', 'customOffsets', 'isAutoPauseMode', 'isOffsetMode', 'currentTime'],
        methods: {
            selectCaption: function (caption, offset) {
                this.$emit('select-caption', caption, offset)
            },
            setCustomOffset: function (caption, offset) {
                this.$emit('set-custom-offset', caption, offset)
            },
            switchSource: function(sourceId) {
                console.log('Switching to source:', sourceId);
                this.$emit('switch-source', sourceId);
            },
            getSourceName: function(sourceId) {
                // Extract a readable name from the source ID
                // Remove file extension and path
                var name = sourceId;
                if (name.includes('/')) {
                    name = name.split('/').pop();
                }
                if (name.includes('\\')) {
                    name = name.split('\\').pop();
                }
                // Remove file extension
                if (name.lastIndexOf('.') > 0) {
                    name = name.substring(0, name.lastIndexOf('.'));
                }
                return name;
            }
        },
        data: function () {
            return {
                bufferTime: 0
            }
        },
        created: function () {
            var self = this;
            self.$watch(function () { return { t: self.currentTime, i: self.isOffsetMode }; }, function () {
                if (self.isOffsetMode) {
                    self.bufferTime = self.currentTime
                }
            }, { immediate: true })
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
              <!-- Display captions from all sources -->
              <template v-for="sourceId in captionSources">
                <!-- Source header -->
                <div class="caption-source-header" v-if="captionSources.length > 1 && captions[sourceId] && captions[sourceId].length > 0" :key="'header-'+sourceId">
                  {{ getSourceName(sourceId) }}
                  <span class="source-active-indicator" v-if="sourceId === activeCaptionSource">(active)</span>
                </div>
                
                <!-- Captions from this source -->
                <span v-if="captions[sourceId]" v-for="(caption, index) in captions[sourceId]" class="caption-controls" :key="sourceId + '-' + caption.id">
                  <caption-item 
                    @select-caption="selectCaption"
                    @set-custom-offset="setCustomOffset"
                    :caption="caption" 
                    :custom-offsets="customOffsets"
                    :isAutoPauseMode="isAutoPauseMode"
                    :isOffsetMode="isOffsetMode"
                    :currentTime="bufferTime"
                    :class="{'active-source': sourceId === activeCaptionSource}"
                  ></caption-item>
                </span>
              </template>
            </div>
          </div>
        </div>
        `
    });

// Video List Component
Vue.component('video-list', {
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
            uploadProgress: 0
          };
        },
        computed: {
          folders() {
            return this.videos.filter(v => v.isDirectory);
          },
          files() {
            return this.videos.filter(v => !v.isDirectory);
          },
          selectedCount() {
            return this.selectedVideos.size;
          }
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
            this.$emit('select', {
              ...video,
              url: `/videos${video.path.startsWith('/') ? '' : '/'}${video.path}`
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
              const validFiles = files.filter(file => 
                file.type.startsWith('video/') || 
                ['.mp4', '.webm', '.ogg', '.mov', '.mkv', '.avi'].some(ext => 
                  file.name.toLowerCase().endsWith(ext)
                )
              );
              
              if (validFiles.length === 0) {
                this.error = 'No valid video files found';
                return;
              }
              
              validFiles.forEach(file => {
                formData.append('files', file);
              });
              
              // Add current path if we're in a directory
              const currentPath = this.currentPath.join('/');
              if (currentPath) {
                formData.append('path', currentPath);
              }
              
              const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
              });
              
              if (!response.ok) {
                const error = await response.text();
                throw new Error(error || 'Upload failed');
              }
              
              // Refresh the video list
              this.loadVideos(currentPath);
              
            } catch (error) {
              console.error('Upload error:', error);
              this.error = 'Upload failed: ' + (error.message || 'Unknown error');
            } finally {
              this.isUploading = false;
            }
          },
          handleDragStart(e, video) {
            e.dataTransfer.setData('text/plain', video.path);
            e.dataTransfer.effectAllowed = 'move';
          },
          
          handleDragOver(e, index) {
            e.preventDefault();
            this.dragOverIndex = index;
            e.dataTransfer.dropEffect = 'move';
          },
          
          handleDragLeave() {
            this.dragOverIndex = -1;
          },
          
          handleDrop(e, targetIndex) {
            e.preventDefault();
            this.dragOverIndex = -1;
            
            const sourcePath = e.dataTransfer.getData('text/plain');
            if (!sourcePath) return;
            
            const sourceIndex = this.videos.findIndex(v => v.path === sourcePath);
            if (sourceIndex === -1 || sourceIndex === targetIndex) return;
            
            // Reorder videos array
            const newVideos = [...this.videos];
            const [movedVideo] = newVideos.splice(sourceIndex, 1);
            
            // Adjust target index if moving item down in the list
            const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
            newVideos.splice(adjustedTargetIndex, 0, movedVideo);
            
            this.videos = newVideos;
          },
          
          async loadVideos(path = '') {
            console.log('loadVideos', path);
            this.isLoading = true;
            this.error = null;
            try {
              const res = await fetch(`/api/videos?path=${encodeURIComponent(path)}`);
              const data = await res.json();
              this.videos = data.videos.sort((a,b) => a.isDirectory === b.isDirectory ? a.name.localeCompare(b.name) : b.isDirectory ? 1 : -1);
              console.log('loadVideos success', this.videos.length);
            } catch (e) {
              console.error('loadVideos error', e);
              this.error = e.message || 'Failed to load';
            } finally {
              this.isLoading = false;
              console.log('loadVideos done');
            }
          },
          formatSize(bytes) {
            const units = ['B','KB','MB','GB']; let i=0; let s=bytes;
            while(s>=1024&&i<units.length-1){s/=1024;i++}
            return s.toFixed(1)+' '+units[i];
          },
          formatDate(ts) {
            return new Date(ts).toLocaleString();
          },
          navigate(name) {
            if(name==='..') this.currentPath.pop(); else this.currentPath.push(name);
            this.loadVideos(this.currentPath.join('/'));
          },
          toggleSelect(v) {
            this.selectedVideos.has(v.path) ? this.selectedVideos.delete(v.path) : this.selectedVideos.add(v.path);
          },
          selectAll() {
            this.selectedVideos = new Set(this.files.map(f=>f.path));
          },
          clearSelection() {
            this.selectedVideos.clear();
          },
          playSelected() {
            const selected = this.files.filter(f => this.selectedVideos.has(f.path));
            if (!selected.length) return;
            
            // Emit the select event to the parent component
            if (selected.length === 1) {
              this.onVideoSelected(selected[0]);
            } else {
              // Emit a playlist of videos
              this.$emit('playlist', selected.map(video => ({
                ...video,
                url: `/videos${video.path.startsWith('/') ? '' : '/'}${video.path}`
              })));
            }
          },
          emitSelect(v) {
            this.onVideoSelected(v);
          }
        },

        handleKeyDown(e) {
            if (e.key === 'Enter' && this.selectedCount && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
              e.preventDefault();
              e.stopPropagation();
              this.playSelected();
            } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
              e.preventDefault();
              e.stopPropagation();
              this.selectAll();
            }
          },
        mounted() {
          console.log('mounted videoList');
          this.loadVideos();
        }
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
            <track v-if="captionsUrl" :key="trackKey" kind="subtitles" :src="captionsUrl" @load="onCaptionsLoad"
              @cuechange="onCaptionsCueChange" default />
            <p>Your browser doesn't support HTML5 video. Here is a <a :href="videoUrl">link to the video</a> instead.</p>
          </video>

          <div class="current-caption"
            :key="shownCaptionsKey" lang="ja" v-html="displayedHtml"></div>
        </div>

        <button @click="toggleVideoList" class="back-button">Back to Videos</button>

        <span id="ab-meta-data" style="display: none;" :data-audio-track="selectedAudioTrack || 0"></span>
        <div id="resize-bar-wrapper" class="resize-bar-wrapper" lang="ja">
          <div id="ab-extension-popup-wrapper"></div>
          <div class="resize-bar" @click.stop.prevent="onResizeBarClick" @mousedown.stop.prevent="onResizeBarMouseDown"></div>
        </div>
        
        <div class="sidebar">
          <caption-bar @select-caption="selectCaption" @set-custom-offset="setCustomOffset"
            @switch-source="switchCaptionSource" :captions="captions" :custom-offsets="customOffsets"
            :is-auto-pause-mode="isAutoPauseMode" :is-offset-mode="isOffsetMode" :current-time="currentTime"
            v-if="captionsUrl" :caption-sources="captionSources"
            :active-caption-source="activeCaptionSource"></caption-bar>
            
          <div v-if="captionsUrl && isOffsetMode" class="offset-hint unselectable">Select the subtitle that ends where
            the video currently is: {{displayAsVideoTime(currentTime)}}</div>
            
          <div class="auto-pause-text unselectable" v-if="isAutoPauseMode">Auto Pause <span
              style="display: inline-block;">:</span><span v-html="autoPauseIcon"></span></div>
              
          <div v-if="captionsUrl" class="controls">
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
            subtitlesFileContent: null,
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
            captionMoveLimitSeconds: 6.0,
            captionBackwardMoveBufferSeconds: 2.0,
            textSelection: "",
            isAutoPauseMode: false,
            autoPauseCaptions: [],
            autoPauseMaxBufferSeconds: 0.30,
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
            helpMode: 'hotkeys',
            bigJumpSeconds: 87,
            isLocalStorageAvailable: true,
            shouldHideRegexMatches: false,
            savedSettings: {
                videoAlignment: 'top',
                showVideoControls: true,
                subtitle1FontSize: 1.0,
                subtitle2FontSize: 1.0,
                regexReplacements: [
                    { regex: '\\(\\(.*?\\)\\)', replaceText: '' },
                    { regex: '\\(.*?\\)', replaceText: '' },
                    { regex: '（.*?）', replaceText: '' }
                ]
            }
        },
        computed: {
            dropWrapperClass: function () {
                return this.isDraggingFile ? "dragging-file" : "";
            },
            subtitlesOffsetSeconds: function () {
                return Utils.parseInputNum(this.subtitlesOffsetInput);
            },
            captionsUrl: function () {
                if (!this.subtitlesFileContent)
                    return null;

                try {
                    var captions = this.fileToCaptions(this.subtitlesFileContent, this.subtitlesOffsetSeconds, this.customOffsets);
                    var vtt = this.formatVtt(captions);
                    if (!vtt) {
                        this.shouldShowSubtitlesError = true;
                        this.subtitlesError = null;
                        return null;
                    }
                    
                    // Create a unique source ID for this subtitle file
                    var sourceId = this.subtitlesFileName || ('subtitle_' + Date.now());
                    
                    // Add to captions map if it doesn't exist
                    if (!this.captions[sourceId]) {
                        // Add to sources list if it's a new source
                        if (this.captionSources.indexOf(sourceId) === -1) {
                            this.captionSources.push(sourceId);
                        }
                        
                        // Set as active source if none is selected
                        if (!this.activeCaptionSource) {
                            this.activeCaptionSource = sourceId;
                        }
                    }
                    
                    // Store captions in the map
                    this.$set(this.captions, sourceId, captions);
                    console.log(this.captions);
                    
                    // Apply furigana to the current captions
                    this.furigana(sourceId);
                    
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
                if (this.activeCaptionSource && this.captions[this.activeCaptionSource]) {
                    this.captions[this.activeCaptionSource].forEach(function (c) { map[c.id] = c; });
                }
                return map;
            },
            allCaptionsMap: function () {
                var map = {};
                var self = this;
                Object.keys(this.captions).forEach(function(sourceId) {
                    self.captions[sourceId].forEach(function(c) {
                        map[c.id] = c;
                    });
                });
                return map;
            },
            activeCaptions: function () {
                if (this.autoPauseCaptions.length > 0)
                    return this.autoPauseCaptions;
                
                if (!this.activeCaptionSource || !this.captions[this.activeCaptionSource]) 
                    return [];
                    
                return this.idsToCaptions(this.activeCaptionIds);
            },
            isVoicedTime: function () {
                var time = this.currentTime;
                var buffer = this.captionBackwardMoveBufferSeconds;
                var isVoiced = function (caption) {
                    return caption.startTime < time && time < caption.endTime + buffer;
                };
                return this.activeCaptions.some(isVoiced);
            },
            shownCaptions: function () {
                if (!this.activeCaptions || !this.captions || !this.captionsMap || !this.isVoicedTime)
                    return [];

                // Get active captions from the current source
                var active = this.activeCaptions;
                var activeLanes = active.map(function (c) { return c.lane; });
                var captionsWithUniqueLanes = active.filter(function (c, i) { return activeLanes.indexOf(c.lane) === i });
                captionsWithUniqueLanes.sort(this.compareByLane);
                
                // Get active captions from all sources (except the current one)
                var allCaptions = [];
                var self = this;
                var time = this.currentTime;
                var buffer = this.captionBackwardMoveBufferSeconds;
                
                // Function to check if a caption is active at the current time
                var isActive = function(caption) {
                    return caption.startTime < time && time < caption.endTime + buffer;
                };
                
                // Add captions from other sources
                this.captionSources.forEach(function(sourceId) {
                    // Skip the active source as we've already processed it
                    if (sourceId === self.activeCaptionSource) return;
                    
                    // Get captions from this source that are active at the current time
                    if (self.captions[sourceId]) {
                        var sourceCaptions = self.captions[sourceId].filter(isActive);
                        if (sourceCaptions.length > 0) {
                            // Add source information to the captions
                            sourceCaptions.forEach(function(caption) {
                                caption.sourceId = sourceId;
                            });
                            allCaptions = allCaptions.concat(sourceCaptions);
                        }
                    }
                });
                
                // Combine captions from all sources
                var result = captionsWithUniqueLanes.concat(allCaptions);
                return result;
            },
            displayedLines: function () {
                if (!this.shownCaptions || !this.shouldShowMainCaption)
                    return "";

                var lines = [];
                var self = this;
                
                // Group captions by source
                var captionsBySource = {};
                this.shownCaptions.forEach(function(caption) {
                    // Make sure we have a valid caption
                    if (!caption) return;
                    
                    // Get the source ID (use the active source if none is specified)
                    var sourceId = caption.sourceId || self.activeCaptionSource;
                    if (!sourceId) return;
                    
                    // Initialize the array for this source if needed
                    if (!captionsBySource[sourceId]) {
                        captionsBySource[sourceId] = [];
                    }
                    
                    // Add the caption to its source group
                    captionsBySource[sourceId].push(caption);
                });
                
                // Process captions from each source
                Object.keys(captionsBySource).forEach(function(sourceId) {
                    var sourceCaptions = captionsBySource[sourceId];
                    if (!sourceCaptions || sourceCaptions.length === 0) return;
                    
                    // Sort by lane to ensure proper stacking order
                    sourceCaptions.sort(self.compareByLane);
                    
                    // Process captions from this source
                    sourceCaptions.forEach(function(caption) {
                        if (!caption || !caption.text) return;
                        
                        // Ensure we have enough lines for proper positioning
                        var linesToAdd = caption.neededNewlines - lines.length;
                        for (var i = 0; i < linesToAdd; i++) {
                            lines.unshift("");
                        }
                        
                        // Split the caption text into lines
                        var captionLines = caption.text.split("\n");
                        if (captionLines.length > 0) {
                            // Add spacing for better readability
                            captionLines[0] = "\n" + captionLines[0];
                            captionLines[captionLines.length - 1] = captionLines[captionLines.length - 1] + "\n";
                        }
                        
                        // Add the caption lines to our display
                        lines = captionLines.concat(lines);
                    });
                });

                return lines;
            },
            displayedHtml: function () {
                if (!this.displayedLines || this.displayedLines.length === 0)
                    return "";
                
                var processedLines = [];
                var hasSubtitle1 = false;
                
                for (var i = 0; i < this.displayedLines.length; i++) {
                    var line = this.displayedLines[i];
                    if (!line || !line.trim()) continue;
                    
                    // Clean up the line text
                    line = this.cleanSubtitleText(line);
                    if (!line.trim()) continue;
                    
                    // First non-empty line is subtitle-1, others are subtitle-2
                    var lineClass = hasSubtitle1 ? 'subtitle-2' : 'subtitle-1';
                    if (!hasSubtitle1) hasSubtitle1 = true;
                    
                    var fontSize = lineClass === 'subtitle-1' ? 
                        this.savedSettings.subtitle1FontSize : 
                        this.savedSettings.subtitle2FontSize;
                        
                    processedLines.push(`<div class="${lineClass}" style="font-size: ${fontSize}em;">${line}</div>`);
                }
                
                return processedLines.join("");
            },
            shownCaptionsKey: function () {
                if (!this.shownCaptions || this.shownCaptions.length === 0)
                    return "";
                return this.shownCaptions.map(function (c) { return c.id; }).join("_");
            },
            offsetButtonClass: function () {
                return 'offset-button button' +
                    (this.isOffsetMode ? ' on' : ' off') +
                    (this.isAutoPauseMode ? ' auto-pause' : '') +
                    ' unselectable';
            },
            notifyTextClass: function () {
                return 'notify-text' + (this.notifyCount > 0 ? ' on' : ' off');
            },
            videoContainerClass: function () {
                return 'video-container' + (this.savedSettings.videoAlignment === 'center' ? ' center' : ' top');
            },
            audioTrackClass: function () {
                return 'audio-track button' +
                    (this.isAutoPauseMode ? ' auto-pause' : '') +
                    ' unselectable';
            },
            helpClass: function () {
                return 'help button' +
                    (this.isAutoPauseMode ? ' auto-pause' : '') +
                    ' unselectable';
            },
            autoPauseIcon: function () {
                if (!this.isPlaying)
                    return "<span class=\"auto-pause-icon paused\">Paused</span>";
                else if (this.skipNextAutoPause)
                    return "<span class=\"auto-pause-icon skipping\">Skipping</span>"
                else
                    return "<span class=\"auto-pause-icon playing\">Playing</span>"
            },
            videoTitle: function () {
                var self = this;
                if (!self.videoFileName)
                    return "Animebook";

                var matches = self.videoFileName
                    .replace(/[a-uw-zA-UW-Z]/g, "a")
                    .replace(/[^a^\d]/g, " ")
                    .split(" ")
                    .filter(function (numText) { return numText && numText.indexOf("a") === -1 });

                var episodeNumber = null;
                if (matches && !matches.every(function (numText) { return self.videoFileName.startsWith(numText); })) {
                    episodeNumber = matches.map(function (numText) { return parseInt(numText) + "" }).join(".");
                }
                return (episodeNumber ? episodeNumber + " | " : "") + self.videoFileName + " | " + "Animebook";
            },
            videoStyle: function () {
                if (!this.cursorVisible && this.isPlaying)
                    return "cursor: none;";
                return "";
            }
        },
        created: function () {
            this.loadSavedSettings();
            this.setUpKeybindings();
        },
        watch: {
            activeCaptions: function (newValue, oldValue) {
                if (oldValue)
                    oldValue.forEach(function (caption) { caption.isActive = false; });
                if (!newValue || newValue.length === 0)
                    return;
                newValue.forEach(function (caption) { caption.isActive = true; });

                if ((this.sideBarX + this.sideBarDragDx) > 1.0 - 0.0001)
                    return;
                if (document.activeElement && document.activeElement.classList.contains("custom-offset-input"))
                    return;
                this.scrollToCaption(newValue[0].id);
            },
            captionsUrl: function (newValue, oldValue) {
                this.trackKey = this.trackKey + 1;
                var isFirefox = typeof InstallTrigger !== 'undefined';
                if (isFirefox)
                    this.videoKey = this.videoKey + 1;
            },
            currentTime: function (newTime, oldTime) {
                var video = this.getVideoElement();
                this.isPlaying = video ? !this.getVideoElement().paused : false;
                this.handleAutoPauseTimeUpdate(newTime);
            },
            isPlaying: function (newValue, oldValue) {
                if (!newValue)
                    this.skipNextAutoPause = false;

                if (newValue !== oldValue)
                    this.showCursor();
            },
            videoTitle: function (newValue, oldValue) {
                document.title = newValue;
            },
            selectedAudioTrack: function (newValue, oldValue) {
                if (!this.audioTracks || this.audioTracks.length <= newValue)
                    return;

                this.enableAudioTrack(newValue);
                // Video gets frozen after an audio track change, so update the time
                this.getVideoElement().currentTime = this.currentTime;
            },
            savedSettings: {
                handler: function (newValue, oldValue) {
                    try {
                        window.localStorage.setItem('savedSettings', JSON.stringify(newValue));
                        this.isLocalStorageAvailable = true;
                    } catch (e) {
                        this.isLocalStorageAvailable = false;
                    }
                },
                deep: true
            }
        },
        methods: {
            cleanSubtitleText: function(text) {
                if (!text) return '';
                
                // First, ensure proper ruby tag structure
                text = text.replace(/([^<]*)<rt>(.*?)<\/rt>([^<]*)/g, (match, before, rt, after) => {
                    // If we don't have a ruby tag, add it
                    if (!before.includes('<ruby>')) {
                        return `${before}<ruby>${before.trim()}<rt>${rt}</rt></ruby>${after}`;
                    }
                    return match; // Already has proper ruby tag
                });
                
                // Remove any HTML tags except ruby/rt/rp
                text = text.replace(/<(?!\/?ruby\b|\/?rt\b|\/?rp\b)[^>]+>/g, '');
                
                // Clean up HTML entities
                text = text
                    .replace(/&gt;/g, '>')
                    .replace(/&lt;/g, '<')
                    .replace(/&amp;/g, '&')
                    .replace(/&quot;/g, '"')
                    .replace(/&apos;/g, "'");
                
                // Clean up any remaining malformed tags or artifacts
                text = text
                    .replace(/<\/?(p|div|span)[^>]*>\s*/g, '') // Remove common HTML tags
                    .replace(/\s+/g, ' ') // Normalize whitespace
                    .trim();
                
                return text;
            },
            onVideoLoad: function (e) {
                var video = this.getVideoElement();
                if (!video.audioTracks || video.audioTracks.length === 0) {
                    this.audioTracks = null;
                    this.selectedAudioTrack = null;
                    return;
                }

                var areNewTracksSameCount = this.audioTrackCount && this.audioTrackCount === video.audioTracks.length;
                var previousSelectedAudioTrack = this.selectedAudioTrack;

                this.audioTracks = video.audioTracks;
                this.audioTrackCount = video.audioTracks.length;
                this.selectedAudioTrack = -1; // force update of the audio track button; it won't update if selectedAudioTrack doesn't change
                if (previousSelectedAudioTrack && previousSelectedAudioTrack < this.audioTracks.length && areNewTracksSameCount)
                    this.selectedAudioTrack = previousSelectedAudioTrack;
                else
                    this.selectedAudioTrack = 0;
                this.enableAudioTrack(this.selectedAudioTrack);
            },
            getVideoElement() {
                return document.getElementById('ab-video-element');
            },
            toggleVideoList() {
                this.showVideoList = !this.showVideoList;
                if (this.showVideoList && this.$refs.videoList) {
                    this.$refs.videoList.loadVideos();
                }
            },
            onVideoSelected(video) {
                if (!video || !video.url) {
                  console.error('Invalid video object:', video);
                  return;
                }
                
                console.log('Video selected:', video);
                this.showVideoList = false;
                this.videoUrl = video.url;
                this.currentVideo = video;
                this.shouldShowVideoError = false;
                this.videoErrorMessage = null;
                this.videoFileName = video.name;
                var self = this;
                this.$nextTick(function() {
                    var videoEl = self.getVideoElement();
                    if (videoEl) {
                        videoEl.src = self.videoUrl;  // Direct URL assignment
                        videoEl.load();
                        videoEl.play().catch(function(e) { 
                            console.error('Video play error:', e);
                            videoEl.controls = true;
                        });
                    }
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
                    json = window.localStorage.getItem('savedSettings');
                } catch (e) {
                    console.error(e);
                    this.isLocalStorageAvailable = false;
                    return;
                }
                if (!json)
                    return;

                var settings = JSON.parse(json);
                if (!settings)
                    return;

                for (k in this.savedSettings) {
                    if (settings.hasOwnProperty(k))
                        this.savedSettings[k] = settings[k];
                }
            },

            setUpKeybindings: function () {
                var self = this;
                window.addEventListener('keydown', function (e) {
                    if (/textarea|select/i.test(event.target.nodeName) || event.target.type === "text")
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
                    let sidebarNG = !self.captionsUrl || self.shouldShowSubtitlesError;
                    let eitherNG = videoNG || sidebarNG;
                    var stopEvent = function () {
                        e.preventDefault();
                        e.stopPropagation();
                        // Ensure the video element keeps focus after key presses
                        var videoElement = self.getVideoElement();
                        if (videoElement) {
                            setTimeout(function() {
                                videoElement.focus();
                            }, 10);
                        }
                    }
                    switch (e.key) {
                        case ' ':
                            if (videoNG)
                                return;
                            stopEvent(e);
                            self.playPause();
                            break;
                        case 'Enter':
                            if (eitherNG)
                                return;
                            stopEvent(e);
                            self.replayCaption();
                            break;
                        case 'ArrowUp':
                            // Toggle visibility of captions
                            if (eitherNG)
                                return;
                            stopEvent(e);
                            self.shouldShowMainCaption = !self.shouldShowMainCaption;
                            self.notify(self.shouldShowMainCaption ? 'Subtitles shown' : 'Subtitles hidden');
                            break;
                        case 'ArrowLeft':
                            if (eitherNG)
                                return;
                            stopEvent(e);
                            self.previousCaption();
                            break;
                        case 'ArrowDown':
                            // replay current caption
                            if (eitherNG)
                                return;
                            stopEvent(e);
                            self.replayCaption();
                            break;
                        case 'ArrowRight':
                            if (eitherNG)
                                return;
                            stopEvent(e);
                            self.nextCaption();
                            break;
                        case 'a':
                        case 'A':
                            if (sidebarNG)
                                return;
                            if (e.ctrlKey || e.altKey || e.metaKey)
                                return;
                            stopEvent(e);
                            self.isAutoPauseMode = !self.isAutoPauseMode;
                            self.lastPauseTime = self.getCurrentTime();
                            break;
                        case '.':
                        case '>':
                            if (eitherNG)
                                return;
                            if (e.ctrlKey || e.altKey || e.metaKey)
                                return;
                            stopEvent(e);
                            self.seekScreenshot(1, !e.shiftKey);
                            break;
                        case ',':
                        case '<':
                            if (eitherNG)
                                return;
                            if (e.ctrlKey || e.altKey || e.metaKey)
                                return;
                            stopEvent(e);
                            self.seekScreenshot(-1, !e.shiftKey);
                            break;
                        case '?':
                            if (e.ctrlKey || e.altKey || e.metaKey)
                                return;
                            stopEvent(e);
                            self.shouldShowHelpPopup = !self.shouldShowHelpPopup;
                            break;
                        case 's':
                        case 'S':
                            if (videoNG)
                                return;
                            if (e.ctrlKey || e.altKey || e.metaKey)
                                return;
                            stopEvent(e);
                            self.copyImage();
                            break;
                        case 'c':
                            if (eitherNG)
                                return;
                            if (e.ctrlKey || e.altKey || e.metaKey)
                                return;
                            stopEvent(e);
                            self.copySubtitle();
                            break;
                        case 'D':
                            if (sidebarNG)
                                return;
                            if (e.ctrlKey || e.altKey || e.metaKey)
                                return;
                            stopEvent(e);
                            var newFileName = self.subtitlesFileName;
                            var dotIndex = newFileName.lastIndexOf('.');
                            if (dotIndex !== -1 && newFileName.length - dotIndex < 5)
                                newFileName = self.subtitlesFileName.substring(0, dotIndex);
                            self.downloadString(self.formatSrt(self.captions), "srt", newFileName + ".srt");
                            break;
                        case 'v':
                        case 'V':
                            if (eitherNG)
                                return;
                            if (e.ctrlKey || e.altKey || e.metaKey)
                                return;
                            stopEvent(e);
                            self.shouldShowMainCaption = !self.shouldShowMainCaption;
                            self.notify(self.shouldShowMainCaption ? "Subtitles shown" : "Subtitles hidden");
                            break;
                        case 'y':
                            toggleControls();
                            break;
                        case 'b':
                        case 'B':
                            if (sidebarNG)
                                return;
                            if (e.ctrlKey || e.altKey || e.metaKey)
                                return;
                            debugger;
                            stopEvent(e);
                            self.toggleSidebar();
                            break;
                        case 't':
                        case 'T':
                            if (videoNG)
                                return;
                            if (e.ctrlKey || e.altKey || e.metaKey)
                                return;
                            stopEvent(e);
                            self.cycleAudioTrack();
                            break;
                        case 'Escape':
                            if (self.shouldShowHelpPopup) {
                                stopEvent(e);
                                self.shouldShowHelpPopup = false;
                            }
                            break;
                        case '\\':
                        case '|':
                            if (eitherNG)
                                return;
                            if (self.isAutoPauseMode && self.isPlaying) {
                                stopEvent(e);
                                self.skipNextAutoPause = true;
                            } else if (self.isAutoPauseMode && !self.isPlaying) {
                                stopEvent(e);
                                self.playPause();
                            }
                            break;
                        case 'PageDown':
                            if (eitherNG)
                                return;
                            stopEvent(e);
                            self.seekXSeconds(self.bigJumpSeconds);
                            break;
                        case 'PageUp':
                            if (eitherNG)
                                return;
                            stopEvent(e);
                            self.seekXSeconds(-self.bigJumpSeconds);
                            break;
                        case 'g':
                        case 'G':
                            if (eitherNG) return;
                            stopEvent(e);
                            if (e.shiftKey) {
                                // Decrease subtitle 2 font size
                                self.savedSettings.subtitle2FontSize = Math.max(0.5, self.savedSettings.subtitle2FontSize - 0.1);
                                self.notify(`Subtitle 2 size: ${self.savedSettings.subtitle2FontSize.toFixed(1)}`);
                            } else {
                                // Decrease subtitle 1 font size
                                self.savedSettings.subtitle1FontSize = Math.max(0.5, self.savedSettings.subtitle1FontSize - 0.1);
                                self.notify(`Subtitle 1 size: ${self.savedSettings.subtitle1FontSize.toFixed(1)}`);
                            }
                            break;
                        case 'R':
                            if (eitherNG) return;
                            if (e.ctrlKey || e.altKey || e.metaKey)
                                return;
                            stopEvent(e);
                            self.shouldHideRegexMatches = !self.shouldHideRegexMatches;
                            if (self.shouldHideRegexMatches) {
                                self.notify("Parentheses hidden");
                            } else {
                                self.notify("Parentheses shown");
                            }
                            break;
                        case 'h':
                        case 'H':
                            if (eitherNG) return;
                            stopEvent(e);
                            if (e.shiftKey) {
                                // Increase subtitle 2 font size
                                self.savedSettings.subtitle2FontSize = Math.min(3.0, self.savedSettings.subtitle2FontSize + 0.1);
                                self.notify(`Subtitle 2 size: ${self.savedSettings.subtitle2FontSize.toFixed(1)}`);
                            } else {
                                // Increase subtitle 1 font size
                                self.savedSettings.subtitle1FontSize = Math.min(3.0, self.savedSettings.subtitle1FontSize + 0.1);
                                self.notify(`Subtitle 1 size: ${self.savedSettings.subtitle1FontSize.toFixed(1)}`);
                            }
                            break;
                        case '-':
                            if (eitherNG)
                                return;
                            stopEvent(e);
                            self.savedSettings.subtitle1FontSize = Math.max(self.savedSettings.subtitle1FontSize - 0.15, 0.5);
                            self.savedSettings.subtitle2FontSize = Math.max(self.savedSettings.subtitle2FontSize - 0.15, 0.5);
                            self.notify(`Font sizes decreased: ${self.savedSettings.subtitle1FontSize.toFixed(1)}/${self.savedSettings.subtitle2FontSize.toFixed(1)}`);
                            break;
                        case '=':
                            if (eitherNG)
                                return;
                            stopEvent(e);
                            self.savedSettings.subtitle1FontSize = Math.min(self.savedSettings.subtitle1FontSize + 0.15, 3.0);
                            self.savedSettings.subtitle2FontSize = Math.min(self.savedSettings.subtitle2FontSize + 0.15, 3.0);
                            self.notify(`Font sizes increased: ${self.savedSettings.subtitle1FontSize.toFixed(1)}/${self.savedSettings.subtitle2FontSize.toFixed(1)}`);
                            break;
                        case 'm':
                        case 'M':
                            if (videoNG)
                                return;
                            stopEvent(e);
                            self.increasePlaybackSpeed(true)
                            break;
                        case 'n':
                        case 'N':
                            if (videoNG)
                                return;
                            stopEvent(e)
                            self.increasePlaybackSpeed(false)
                            break;
                    }
                });

            },

            calcAppStyle: function () {
                return this.calcGridTemplateAreas() + this.calcGridTemplateColumns(); // + this.calcGridTemplateRows();
            },

            calcGridTemplateAreas: function () {
                if (!this.videoUrl && !this.captionsUrl && !this.shouldShowSubtitlesError) {
                    return "grid-template-areas: " +
                        "'video video video' " +
                        ";";
                }

                return "grid-template-areas: " +
                    "'video resizeBar sidebar' " +
                    ";";
            },

            calcGridTemplateColumns: function () {
                var leftWidth = this.sideBarX + this.sideBarDragDx;
                var middleWidth = 0;
                var rightWidth = (1 - leftWidth);
                var widths = [leftWidth, middleWidth, rightWidth]
                return "grid-template-columns: " + widths.map(function (x) { return x * 100 + "%"; }).join(" ") + ";"
            },

            toggleOffsetMode: function () {
                this.isOffsetMode = !this.isOffsetMode;
            },

            onOffsetInputScroll: function (e) {
                if (e.target == document.activeElement)
                    return;
                if (e.deltaY < 0) {
                    this.subtitlesOffsetInput = (this.subtitlesOffsetSeconds + 0.1).toFixed(1);
                } else if (e.deltaY > 0) {
                    this.subtitlesOffsetInput = (this.subtitlesOffsetSeconds - 0.1).toFixed(1);
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
                return 'help-mode-tab' +
                    (this.helpMode === mode ? ' selected' : '');
            },

            hideCursor: function () {
                this.mouseTimer = null;
                this.cursorVisible = false;
            },

            showCursor: function () {
                if (this.mouseTimer)
                    window.clearTimeout(this.mouseTimer);
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
                this.sideBarDragDx = this.pixelsToFraction(e.clientX) - this.sideBarDragStartX;
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
                if ((mouseY >= 0 && mouseY <= window.innerHeight)
                    && (mouseX >= 0 && mouseX <= window.innerWidth))
                    return;
                this.onMouseUp(null);
            },

            onResizeBarMouseDown: function (e) {
                this.isDraggingSidebar = true;
                this.sideBarDragStartX = this.pixelsToFraction(e.clientX);
            },

            onResizeBarClick: function (e) {
                if (this.resizeBarClick) {
                    clearTimeout(this.click)
                    this.toggleSidebar();
                }
                this.resizeBarClick = setTimeout(() => {
                    this.resizeBarClick = undefined
                }, 400)
            },

            toggleSidebar: function () {
                if (this.sideBarX <= 0.99) {
                    this.previousSideBarX = this.sideBarX;
                    this.sideBarX = 1.00;
                } else {
                    this.sideBarX = Math.min(this.previousSideBarX, 0.90);
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
                const input = document.getElementById('ab-file-browse-input');
                input.click();
            },

            onFileInputChange: function (e) {
                const input = document.getElementById('ab-file-browse-input');
                const files = input.files;
                if (files && files.length > 0)
                    this.handleDroppedFiles(files);
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
                console.log('[DEBUG] onVideoSeek - called');
                this.currentTime = this.getCurrentTime();
                console.log('[DEBUG] onVideoSeek - currentTime:', this.currentTime);
                
                // Update captions immediately and schedule another update after a short delay
                this.updateActiveCaptions();
                setTimeout(this.updateActiveCaptions.bind(this), 50);
                
                // Ensure video element keeps focus
                var videoElement = this.getVideoElement();
                if (videoElement) {
                    setTimeout(function() {
                        videoElement.focus();
                    }, 10);
                }
            },
            
            updateActiveCaptions: function() {
                console.log('[DEBUG] updateActiveCaptions - called');
                if (!this.captions || !this.activeCaptionSource) {
                    console.log('[DEBUG] updateActiveCaptions - No captions or active source');
                    return;
                }
                
                var currentTime = this.getCurrentTime();
                var sourceCaptions = this.captions[this.activeCaptionSource];
                
                if (!sourceCaptions || !sourceCaptions.length) {
                    console.log('[DEBUG] updateActiveCaptions - No source captions available');
                    return;
                }
                
                console.log('[DEBUG] updateActiveCaptions - Checking', sourceCaptions.length, 'captions for time:', currentTime);
                
                // Find captions that should be active at the current time
                var matchingCaptions = sourceCaptions.filter(function(caption) {
                    return currentTime >= caption.startTime && currentTime <= caption.endTime;
                });
                
                console.log('[DEBUG] updateActiveCaptions - Found', matchingCaptions.length, 'matching captions');
                
                if (matchingCaptions.length > 0) {
                    var newIds = matchingCaptions.map(function(caption) { return caption.id; });
                    
                    // Only update if the IDs have changed
                    var idsChanged = false;
                    if (!this.activeCaptionIds || this.activeCaptionIds.length !== newIds.length) {
                        idsChanged = true;
                    } else {
                        for (var i = 0; i < newIds.length; i++) {
                            if (this.activeCaptionIds.indexOf(newIds[i]) === -1) {
                                idsChanged = true;
                                break;
                            }
                        }
                    }
                    
                    if (idsChanged) {
                        console.log('[DEBUG] updateActiveCaptions - Updating activeCaptionIds:', newIds);
                        this.activeCaptionIds = newIds;
                        
                        // Just update the active captions without replaying
                        if (this.activeCaptions && this.activeCaptions.length > 0) {
                            console.log('[DEBUG] updateActiveCaptions - Updated active caption text:', this.activeCaptions[0].text);
                        }
                    }
                } else if (this.activeCaptionIds && this.activeCaptionIds.length > 0) {
                    // Clear active captions if no matches and we had active captions before
                    console.log('[DEBUG] updateActiveCaptions - Clearing activeCaptionIds');
                    this.activeCaptionIds = [];
                }
            },

            getVideoElement: function () {
                return this.$el.querySelector("#ab-video-element");
            },

            onTimeUpdate: function () {
                this.currentTime = this.getCurrentTime();
                console.log('[DEBUG] onTimeUpdate - currentTime:', this.currentTime);
                
                // Use our updateActiveCaptions method to handle caption updates
                this.updateActiveCaptions();
                
                // Debug active captions
                console.log('[DEBUG] onTimeUpdate - activeCaptions:', this.activeCaptions ? this.activeCaptions.length : 'null');
                if (this.activeCaptions && this.activeCaptions.length > 0) {
                    console.log('[DEBUG] onTimeUpdate - First activeCaption text:', this.activeCaptions[0].text);
                }
            },

            getCurrentTime: function () {
                console.log('[DEBUG] getCurrentTime - called');
                var videoElement = this.getVideoElement();
                return videoElement ? videoElement.currentTime : 0;
            },

            getTotalDuration: function () {
                console.log('[DEBUG] getTotalDuration - called');
                var videoElement = this.getVideoElement();
                return videoElement ? videoElement.duration : 0;
            },

            setCurrentTime: function (time, shouldPlay) {
                console.log('[DEBUG] setCurrentTime - time:', time, 'shouldPlay:', shouldPlay);
                try {
                    var videoElement = this.getVideoElement();
                    console.log('[DEBUG] setCurrentTime - videoElement:', videoElement ? 'exists' : 'null');
                    if (videoElement) {
                        // Update our internal time tracker first
                        this.currentTime = time;
                        console.log('[DEBUG] setCurrentTime - Updated internal currentTime:', this.currentTime);
                        
                        // Then update the video element's time
                        videoElement.currentTime = time;
                        console.log('[DEBUG] setCurrentTime - Set video currentTime to:', time);
                        
                        // Handle play/pause in a try-catch to prevent AbortError
                        try {
                            if (shouldPlay) {
                                // Use Promise-based play() with error handling
                                videoElement.play()
                                    .catch(error => {
                                        console.warn('Error during play after seeking:', error);
                                        // If we get an AbortError, it's usually because we're seeking too rapidly
                                        // We can safely ignore this as it's a normal part of seeking
                                        if (error.name !== 'AbortError') {
                                            console.error('Unexpected error during play:', error);
                                        }
                                    });
                            } else {
                                this.pause();
                            }
                        } catch (playError) {
                            console.warn('Error during play/pause after seeking:', playError);
                        }
                        
                        this.lastPauseTime = time;
                        this.skipNextAutoPause = false;
                    }
                } catch (error) {
                    console.error('Error in setCurrentTime:', error);
                }
            },

            copySubtitle: function () {
                if (!this.activeCaptions)
                    return;
                var helpertextarea = document.createElement("textarea");
                document.body.appendChild(helpertextarea);
                helpertextarea.value = this.activeCaptions.map(function (c) { return c.text.trim(); }).join("\n");
                helpertextarea.select();
                document.execCommand("copy");
                this.clearSelection();
                document.body.removeChild(helpertextarea);
                this.notify("Copied current subtitle to clipboard");
            },

            clearSelection: function () {
                if (window.getSelection)
                    window.getSelection().removeAllRanges();
                else if (document.selection)
                    document.selection.empty();
            },

            playPause: function (e) {
                var video = this.getVideoElement();
                if (video.paused) {
                    video.play();
                }
                else {
                    this.pause();
                }
            },

            pause: function (e) {
                var video = this.getVideoElement();
                if (video.paused)
                    return;
                video.pause();
                this.lastPauseTime = this.getCurrentTime();
                this.isPlaying = false;
            },

            idsToCaptions: function (ids) {
                console.log('[DEBUG] idsToCaptions - ids:', ids);
                if (!ids) {
                    console.log('[DEBUG] idsToCaptions - No ids provided');
                    return [];
                }
                if (!this.captions) {
                    console.log('[DEBUG] idsToCaptions - No captions available');
                    return [];
                }
                if (!this.activeCaptionSource) {
                    console.log('[DEBUG] idsToCaptions - No activeCaptionSource');
                    return [];
                }
                if (!this.captions[this.activeCaptionSource]) {
                    console.log('[DEBUG] idsToCaptions - No captions for activeCaptionSource:', this.activeCaptionSource);
                    return [];
                }

                var self = this;
                var result = ids.map(function (id) { 
                    var caption = self.captionsMap[id];
                    console.log('[DEBUG] idsToCaptions - id:', id, 'found caption:', caption ? 'yes' : 'no');
                    return caption; 
                }).filter(function(caption) { 
                    return caption !== undefined; 
                });
                
                console.log('[DEBUG] idsToCaptions - Returning', result.length, 'captions');
                return result;
            },
            
            getCaptionsById: function(ids) {
                if (!ids || ids.length === 0)
                    return [];
                    
                if (!this.activeCaptionSource || !this.captions[this.activeCaptionSource])
                    return [];
                    
                var self = this;
                return ids.map(function(id) {
                    // Look for the caption in the active source first
                    var caption = self.captionsMap[id];
                    if (caption) return caption;
                    
                    // If not found, try other sources
                    for (var sourceId in self.captions) {
                        if (sourceId === self.activeCaptionSource) continue;
                        
                        var sourceCaptions = self.captions[sourceId];
                        for (var i = 0; i < sourceCaptions.length; i++) {
                            if (sourceCaptions[i].id === id) {
                                return sourceCaptions[i];
                            }
                        }
                    }
                    
                    return undefined;
                }).filter(function(caption) {
                    return caption !== undefined;
                });
            },
            
            getSourceName: function(sourceId) {
                if (!sourceId) return 'Unknown';
                
                // If the source ID is a filename, extract a readable name from it
                if (sourceId.includes('.')) {
                    // Remove file extension
                    var name = sourceId.split('.').slice(0, -1).join('.');
                    // Replace underscores and hyphens with spaces
                    name = name.replace(/[_-]/g, ' ');
                    // Capitalize first letter of each word
                    name = name.split(' ').map(function(word) {
                        return word.charAt(0).toUpperCase() + word.slice(1);
                    }).join(' ');
                    return name;
                }
                
                // For auto-generated IDs, provide a generic name
                if (sourceId.startsWith('subtitle_')) {
                    return 'Subtitle ' + (this.captionSources.indexOf(sourceId) + 1);
                }
                
                return sourceId;
            },
            
            switchCaptionSource: function(sourceId) {
                if (this.captionSources.indexOf(sourceId) !== -1) {
                    this.activeCaptionSource = sourceId;
                    // Reset active captions when switching sources
                    this.activeCaptionIds = [];
                    this.clearAutoPauseCaptions();
                }
            },

            playCaption: function (caption) {
                console.log('[DEBUG] playCaption - caption:', caption);
                if (!caption) {
                    console.log('[DEBUG] playCaption - No caption provided');
                    return;
                }
                
                // Only seek if the current time is not within the caption's time range
                const currentTime = this.getCurrentTime();
                const isOutsideCaptionRange = currentTime < caption.startTime || currentTime > caption.endTime;
                
                console.log('[DEBUG] playCaption - Current time:', currentTime, 'Caption range:', caption.startTime + ' - ' + caption.endTime, 'Outside range:', isOutsideCaptionRange);
                
                if (isOutsideCaptionRange) {
                    console.log('[DEBUG] playCaption - Seeking to:', caption.startTime + 0.0001);
                    this.setCurrentTime(caption.startTime + 0.0001, true);
                } else {
                    console.log('[DEBUG] playCaption - Already within caption time range, not seeking');
                }
                
                // Update active caption without causing a seek
                this.activeCaptionIds = [caption.id];
                console.log('[DEBUG] playCaption - Set activeCaptionIds to:', this.activeCaptionIds);
            },

            replayCaption: function () {
                console.log('[DEBUG] replayCaption - called');
                var currentCaption = null;
                
                // Try to get the current caption from activeCaptions
                if (this.activeCaptions && this.activeCaptions.length > 0) {
                    currentCaption = this.activeCaptions[0];
                    console.log('[DEBUG] replayCaption - Using first activeCaption');
                }
                
                // If no active caption, try to find one at the current time
                if (!currentCaption) {
                    var currentTime = this.currentTime;
                    var sourceCaptions = this.captions[this.activeCaptionSource];
                    if (sourceCaptions && sourceCaptions.length) {
                        // Find caption that includes current time
                        for (var i = 0; i < sourceCaptions.length; i++) {
                            if (currentTime >= sourceCaptions[i].startTime && currentTime <= sourceCaptions[i].endTime) {
                                currentCaption = sourceCaptions[i];
                                console.log('[DEBUG] replayCaption - Found caption at current time:', currentCaption);
                                break;
                            }
                        }
                        
                        // If still no caption, use the first one as fallback
                        if (!currentCaption) {
                            console.log('[DEBUG] replayCaption - Falling back to first caption');
                            currentCaption = sourceCaptions[0];
                        }
                    }
                }
                
                console.log('[DEBUG] replayCaption - currentCaption:', currentCaption);
                if (currentCaption) {
                    this.playCaption(currentCaption);
                } else {
                    console.log('[DEBUG] replayCaption - No caption to replay');
                }
            },

            previousCaption: function (e) {
                this.moveCaptionsBy(-1);
            },

            nextCaption: function (e) {
                this.moveCaptionsBy(1);
            },

            moveCaptionsBy: function (numCaptions) {
                if (!this.captions)
                    return;

                var self = this;
                var getNext = function (currentCaptions, currentTime) {
                    if (!currentCaptions || currentCaptions.length === 0)
                        return null;

                    var currentCaption = numCaptions < 0 ? currentCaptions[0] : currentCaptions[currentCaptions.length - 1]
                    if (numCaptions < 0 && (currentCaption.endTime + self.captionBackwardMoveBufferSeconds) < currentTime)
                        return currentCaption;

                    if (numCaptions > 0 && (currentTime < currentCaption.startTime - 0.01))
                        return currentCaption;

                    return self.findNeighboringCaptionByOffset(currentCaption, numCaptions);
                }

                var captions = this.activeCaptions;
                var next = getNext(captions, this.currentTime);
                if (!next || this.tooFarAway(this.currentTime, next, numCaptions)) {
                    this.shiftVideoTime(numCaptions);
                } else {
                    this.playCaption(next);
                }
            },

            findNeighboringCaptionByOffset: function (caption, offset) {
                return this.captionsMap["id_" + (parseInt(caption.id.replace("id_", "")) + offset)];
            },

            shiftVideoTime: function (numShifts) {
                var newTime = this.currentTime + (numShifts * this.captionMoveLimitSeconds);
                this.setTimeWithinBounds(newTime);
            },

            setTimeWithinBounds: function (time) {
                this.setCurrentTime(Math.min(Math.max(time, 0.0), this.getTotalDuration() - 0.1), true)
            },

            tooFarAway: function (currentTime, nextCaption, numCaptionsMovingBy) {
                if (numCaptionsMovingBy > 0) {
                    return Math.abs(currentTime - nextCaption.startTime) > this.captionMoveLimitSeconds
                } else {
                    return Math.abs(currentTime - (nextCaption.endTime + this.captionBackwardMoveBufferSeconds)) > this.captionMoveLimitSeconds
                }
            },

            seekXSeconds: function (seconds) {
                var isPositive = seconds >= 0;
                var startCaption = isPositive ? this.activeCaptions[this.activeCaptions.length - 1] : this.activeCaptions[0];
                if (!startCaption)
                    startCaption = this.captions[0]
                var currentTime = this.getVideoElement().currentTime;
                var nextTime = currentTime + seconds;

                if (startCaption)
                    this.selectCaptionClosestToNextTime(startCaption, nextTime, isPositive)

                this.setTimeWithinBounds(nextTime);
            },

            selectCaptionClosestToNextTime: function (startCaption, nextTime, isPositive) {
                var self = this;
                var current = startCaption;
                var getNext = function () {
                    return self.findNeighboringCaptionByOffset(current, isPositive ? 1 : -1);
                };
                var containsNextTime = function (caption) {
                    return caption.startTime < nextTime && nextTime < caption.endTime;
                };
                var next = getNext();
                var maxToScan = 100;
                for (var i = 0; i < maxToScan && next; i++) {
                    if (containsNextTime(current) && !containsNextTime(next))
                        break;
                    if ((isPositive && nextTime < next.startTime) ||
                        (!isPositive && next.endTime < nextTime))
                        break;
                    current = next;
                    var next = getNext();
                }

                this.activeCaptionIds = [current.id];
            },

            seekScreenshot: function (numCaptions, shouldAutoCopy) {
                if (!this.captions || !this.captions.length === 0)
                    return;

                var currentCaption;
                if (!this.activeCaptions || this.activeCaptions.length === 0)
                    currentCaption = this.captions[0];
                else
                    currentCaption = numCaptions > 0 ?
                        this.activeCaptions[this.activeCaptions.length - 1] :
                        this.activeCaptions[0];

                var nextCaption = currentCaption;

                // Only move to a neighboring caption if we're already past or around the center of the current caption
                var currentCenter = this.calculateCaptionCenter(currentCaption);
                var centerRadius = Math.max(0.25, (currentCaption.startTime - currentCaption.endTime) / 8);
                if ((numCaptions < 0 && this.currentTime < currentCenter + centerRadius) ||
                    (numCaptions > 0 && currentCenter - centerRadius < this.currentTime)) {
                    nextCaption = this.findNeighboringCaptionByOffset(nextCaption, numCaptions)
                }

                var nextCenter = this.calculateCaptionCenter(nextCaption);
                this.setCurrentTime(nextCenter, false);
                this.activeCaptionIds = [nextCaption.id];
                this.clearAutoPauseCaptions();

                if (shouldAutoCopy) {
                    this.scheduledImageCopies = Math.min(10, this.scheduledImageCopies + 1);
                    setTimeout(this.onVideoSeek, 1000);
                }
            },

            calculateCaptionCenter: function (caption) {
                return (caption.startTime + caption.endTime) / 2;
            },

            copyImage: function () {
                var video = this.getVideoElement();
                if (!video)
                    return;
                var canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                if (typeof ClipboardItem === 'undefined') {
                    this.notify("Failed to copy screenshot to clipboard. Browser doesn't support ClipboardItem.");
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
                        navigator.clipboard.write([
                            new ClipboardItem({
                                [blob.type]: blob
                            })
                        ]).then(function () {
                            self.notify("Copied screenshot to clipboard");
                        }, function (e) {
                            self.notify("Failed to copy screenshot to clipboard: " + e);
                        });
                    } catch (e) {
                        self.notify("Failed to copy screenshot to clipboard: " + e)
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
                var previousTextSelection = this.textSelection || '';
                try {
                    var selection = window.getSelection();
                    this.textSelection = selection && selection.rangeCount > 0 ? selection.toString() : '';
                } catch (e) {
                    console.warn('Error getting text selection:', e);
                    this.textSelection = '';
                }
                
                if (this.textSelection && this.textSelection.length > 0 && this.textSelection !== previousTextSelection) {
                    return;
                }

                if (this.isOffsetMode) {
                    this.subtitlesOffsetInput = (this.subtitlesOffsetSeconds + offset).toFixed(2);
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
                    if (el)
                        el.focus();
                }, 0);
            },

            getTrack: function () {
                console.log('[DEBUG] getTrack - called');
                var videoElement = this.getVideoElement();
                console.log('[DEBUG] getTrack - videoElement:', videoElement ? 'exists' : 'null');
                if (!videoElement) {
                    console.log('[DEBUG] getTrack - No video element');
                    return null;
                }
                console.log('[DEBUG] getTrack - textTracks:', videoElement.textTracks ? videoElement.textTracks.length : 'null');
                if (!videoElement.textTracks || videoElement.textTracks.length === 0) {
                    console.log('[DEBUG] getTrack - No text tracks available');
                    return null;
                }
                
                // Ensure the track is in showing mode
                var track = videoElement.textTracks[0];
                if (track && track.mode !== "showing") {
                    track.mode = "showing";
                    console.log('[DEBUG] getTrack - Set track.mode to showing');
                }
                
                console.log('[DEBUG] getTrack - Returning track 0');
                return track;
            },                    

            enableAudioTrack: function (audioTrackIndex) {
                for (var i = 0; i < this.audioTracks.length; i++)
                    this.audioTracks[i].enabled = false;
                this.audioTracks[audioTrackIndex].enabled = true;
            },

            cycleAudioTrack: function () {
                if (this.audioTracks === null || this.selectedAudioTrack === null) {
                    if (this.getVideoElement().audioTracks === undefined)
                        this.notify("No audio tracks exist. See ? for enabling audio tracks in your browser.");
                    else
                        this.notify("Could not find audio tracks in video")
                    return;
                }
                this.selectedAudioTrack = (this.selectedAudioTrack + 1) % this.audioTracks.length;
                var newTrack = this.audioTracks[this.selectedAudioTrack];
                this.notify("Audio Track: " + (this.selectedAudioTrack + 1) + "/" + this.audioTracks.length +
                    (newTrack.language ? " [" + newTrack.language + "]" : "") +
                    (newTrack.label ? " " + newTrack.label : ""))
            },

            addRegexReplacement: function () {
                this.savedSettings.regexReplacements.push({ regex: "", replaceText: "" });
            },

            removeRegexReplacement: function (index) {
                this.savedSettings.regexReplacements.splice(index, 1);
            },

            hideRegexMatches: function (captions) {
                var replacements = this.savedSettings.regexReplacements;
                for (var i = 0; i < replacements.length; i++) {
                    try {
                        var regex = new RegExp(replacements[i].regex, 'g');
                        var replaceText = replacements[i].replaceText;
                        captions.forEach(function (caption) {
                            caption.text = caption.text.replace(regex, replaceText);
                        });
                    } catch (e) {
                        continue;
                    }
                }
            },

            onCaptionsLoad: function (e) {
                console.log('[DEBUG] onCaptionsLoad - called');
                
                // Initialize captions map for faster lookup
                if (this.captions && this.activeCaptionSource) {
                    console.log('[DEBUG] onCaptionsLoad - Initializing captionsMap');
                    this.captionsMap = {};
                    var sourceCaptions = this.captions[this.activeCaptionSource];
                    if (sourceCaptions && sourceCaptions.length) {
                        for (var i = 0; i < sourceCaptions.length; i++) {
                            var caption = sourceCaptions[i];
                            if (caption && caption.id) {
                                this.captionsMap[caption.id] = caption;
                            }
                        }
                        console.log('[DEBUG] onCaptionsLoad - Initialized captionsMap with', Object.keys(this.captionsMap).length, 'captions');
                    }
                }
                
                // Check for captions at the current time
                this.updateActiveCaptions();
            },

            onCaptionsCueChange: function (e) {
                console.log('[DEBUG] onCaptionsCueChange - called');
                
                // We're using our manual caption tracking system instead
                // This function is kept for compatibility but doesn't do anything
                console.log('[DEBUG] onCaptionsCueChange - Using manual caption tracking instead');
            },

            handleAutoPauseCaptionUpdate: function (newCaptionIds) {
                if (newCaptionIds.length === 0)
                    return;
                var removedCaptionIds = this.activeCaptionIds.filter(function (id) { return newCaptionIds.indexOf(id) === -1; });
                var removedCaptions = this.idsToCaptions(removedCaptionIds);
                this.handleAutoPause(this.getCurrentTime(), removedCaptionIds);
            },

            handleAutoPauseTimeUpdate: function (newTime) {
                if (this.isPlaying)
                    this.clearAutoPauseCaptions();

                if (newTime < this.lastPauseTime)
                    this.lastPauseTime = newTime;

                this.handleAutoPause(newTime, []);
            },

            handleAutoPause: function (time, removedCaptionIds) {
                if (!this.isAutoPauseMode || !this.activeCaptions || this.activeCaptions.length === 0)
                    return;

                var self = this;
                var nextCaption = this.findNeighboringCaptionByOffset(this.activeCaptions[this.activeCaptions.length - 1], 1);
                var shouldBeAutoPaused = function (caption) {
                    var buffer = self.autoPauseMaxBufferSeconds;
                    if (removedCaptionIds.indexOf(caption.id) !== -1)
                        buffer = 0;
                    else if (nextCaption && caption.endTime < nextCaption.startTime) {
                        var nonVoicedSpace = (nextCaption.startTime - caption.endTime);
                        buffer = nonVoicedSpace - self.preCaptionAutoPauseNet;
                        buffer = Math.max(0, Math.min(buffer, self.autoPauseMaxBufferSeconds))
                    }

                    return caption.endTime + buffer < time && self.captionHasPlayed(caption);
                };

                if (this.activeCaptions.some(shouldBeAutoPaused)) {
                    if (this.skipNextAutoPause) {
                        this.skipNextAutoPause = false;
                        this.lastPauseTime = time;
                        return;
                    }
                    this.autoPauseCaptions = this.activeCaptions;
                    this.pause();
                }
            },

            captionHasPlayed: function (caption) {
                var captionLength = Math.abs(caption.endTime - caption.startTime);
                var minSecondsNeeded = Math.min(0.3, captionLength - 0.01);
                var secondsNeededToHavePlayed = Math.max(minSecondsNeeded, captionLength * this.minimumPercentNeededToPlayBeforeAutoPause);
                return this.lastPauseTime < (caption.endTime - secondsNeededToHavePlayed)
            },

            clearAutoPauseCaptions: function () {
                if (this.autoPauseCaptions.length > 0)
                    this.autoPauseCaptions = [];
            },

            scrollToCaption: function (captionId) {
                var el = this.$el.querySelector("#" + captionId);
                if (el.scrollIntoViewIfNeeded)
                    el.scrollIntoViewIfNeeded(true);
                else
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            },

            isCaptions: function (file) {
                return /\.(vtt|srt|ass|ssa)$/i.test(file.name);
            },
            loadCaptions: function (file) {
                this.subtitlesFileName = file.name;
                this.shouldShowSubtitlesError = false;
                this.subtitlesError = null;
                var reader = new FileReader();
                reader.readAsText(file);
                var self = this;
                reader.onload = function (e) {
                    console.log(e, self, reader.result);
                    self.subtitlesFileContent = reader.result;
                    self.activeCaptionIds = [];
                    self.customOffsets = {};
                    if (self.sideBarX > 0.99)
                        self.toggleSidebar();
                };
            },

            stripHtml: function (line) {
                var doc = new DOMParser().parseFromString(line, 'text/html');
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
                                if (found[0] == '\p0') {
                                    isDrawingMode = false;
                                } else {
                                    isDrawingMode = true;
                                }
                            }
                        }
                    }
                    return spokenText.replace(/\\N/gi, "\n").trim();
                }

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
                text = text.replace(/\r/g, '');
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
                        var text = self.stripHtml(lines.slice(2).join("\n").replace(/\{\\an[0-9]{1,2}\}/g, ''));
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
                if (text.indexOf("WEBVTT") !== 0)
                    return null;

                text = text.replace(/\r/g, '');
                var reTime = /(\d\d):(\d\d):(\d\d).(\d\d\d)/;
                var reTimeNoHours = /()(\d\d):(\d\d).(\d\d\d)/;

                var hasTimeStamp = function (text) {
                    return reTime.test(text) || reTimeNoHours.test(text);
                }

                if (!hasTimeStamp(text)) {
                    return null;
                }

                var getSeconds = function (timeStr) {
                    var match = timeStr.match(reTime);
                    if (!match)
                        match = timeStr.match(reTimeNoHours)
                    return (
                        Math.round(
                            (match[1] ? (parseInt(match[1], 10) * 60 * 60 * 1000) : 0) +
                            parseInt(match[2], 10) * 60 * 1000 +
                            parseInt(match[3], 10) * 1000 +
                            parseInt(match[4], 10)
                        ) / 1000
                    );
                };

                var entries = text.split(/\n[\n]+/g);
                var captions = entries
                    .map(function (entry) {
                        if (!hasTimeStamp(entry))
                            return null;

                        var entryId = null;
                        var lines = entry.split(/\n+/g);

                        if (lines.length > 0 && !hasTimeStamp(lines[0])) {
                            entryId = lines[0]
                            lines = lines.slice(1, lines.length);
                        }
                        if (lines.length < 2)
                            return null;

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
                if (!captions)
                    return null;

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
                        formatTime(caption.startTime) +
                        " --> " +
                        formatTime(caption.endTime),
                        (caption.voice ? "<v " + caption.voice + ">" : "") +
                        caption.text,
                    ].join("\n");
                });

                return "WEBVTT\n\n" + lines.join("\n\n");
            },

            formatSrt: function (captions) {
                if (!captions)
                    return null;

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
                        formatTime(caption.startTime) +
                        " --> " +
                        formatTime(caption.endTime),
                        (caption.voice ? "(" + caption.voice + ") " : "") +
                        caption.text,
                    ].join("\n");
                });

                return lines.join("\n\n");
            },
            ruby: function (arr, sourceId, index) {
                if (!sourceId || !this.captions[sourceId] || !this.captions[sourceId][index]) {
                    console.warn('Invalid source or index for ruby function');
                    return;
                }
                if(!arr || !arr.length) {
                    console.warn('Invalid furigana array for ruby function');
                    // If no furigana data but text exists, handle it appropriately
                    const text = this.captions[sourceId][index].text;
                    if (text && !text.includes("<p>") && !isJapanese(text)) {
                        this.captions[sourceId][index].text = `<p>${text}</p>`;
                    }
                    return;
                }
                
                if(this.captions[sourceId][index].text.includes("<ruby")) {
                    console.warn('Caption already contains ruby tags');
                    return;
                }
                
                const originalText = this.captions[sourceId][index].text;
                this.captions[sourceId][index].text = "";
                console.log('[DEBUG] ruby - Processing furigana for caption', index, 'in source', sourceId);

                let hasJapanese = false;
                let hasNonJapanese = false;
                let processedText = "";
                
                // First pass: check if we have mixed content
                for (let t of arr) {
                    const text = typeof t === "object" ? t[0] : t;
                    if (isJapanese(text)) {
                        hasJapanese = true;
                    } else if (text.trim().length > 0) {
                        hasNonJapanese = true;
                    }
                }
                
                // Process each token
                for (let t of arr) {
                    try {
                        let kj = typeof t === "object" ? t[0] : t;
                        let kn = typeof t === "object" ? t[1] : "";
                        kn = kj === kn ? "" : kn;
                        
                        // Handle non-Japanese text
                        if (!isJapanese(kj)) {
                            if (hasJapanese && hasNonJapanese) {
                                // If we have mixed content, wrap non-Japanese in <p> tags
                                processedText += `<p>${kj}</p>`;
                            } else {
                                processedText += kj;
                            }
                            continue;
                        }
                        
                        // Process Japanese text with furigana
                        let kja = kj.split('');
                        let kna = kn.split('');
                        let ka = [];
                        
                        // Process common characters at the end
                        let j = 0;
                        for (let i = 1; i <= Math.min(kja.length, kna.length); i++) {
                            const k = kja[kja.length - i];
                            const n = kna[kna.length - i + j];
                            
                            if (k === n) {
                                let e = kja.splice(kja.length - i, 1)[0];
                                kna.splice(kna.length - i + j, 1);
                                i -= 1;
                                ka.unshift(e);
                            } else {
                                break;
                            }
                        }
                        
                        // Create ruby for Japanese text
                        if (kna.length > 0) {
                            let wordType = getWordType(kja.join(''), kna.join(''));
                            const color = colorMap[wordType] || colorMap.default;
                            processedText += `<ruby style="color:${color}">${kja.join('')}<rt>${kna.join('')}</rt></ruby>${ka.join('')}`;
                        } else {
                            processedText += kja.join('') + ka.join('');
                        }
                    } catch (e) {
                        console.error('Error processing furigana:', e);
                        // Fallback: just add the original text
                        const text = typeof t === 'object' ? t[0] : t;
                        //if (isJapanese(text)) {
                        processedText += text;
                        //} else {
                        //    processedText += `<p>${text}</p>`;
                        //}
                    }
                }
                
                // Set the final processed text
                this.captions[sourceId][index].text = processedText;
                console.log('[DEBUG] ruby - Processed caption:', processedText);
            },
            furigana: async function (sourceId, limit = 50) {
                try {
                    // Use active source if not specified
                    if (!sourceId && this.activeCaptionSource) {
                        sourceId = this.activeCaptionSource;
                    }
                    
                    // Validate source exists
                    if (!sourceId || !this.captions || !this.captions[sourceId]) {
                        console.warn('No valid caption source for furigana:', sourceId);
                        return;
                    }
                    
                    console.log('Processing furigana for source:', sourceId, 'with limit:', limit);
                    
                    // Initialize tokenizer
                    tokenizer = await initializeTokenizer();
                    const promises = [];
                    const captionsArray = this.captions[sourceId];
                    
                    if (!Array.isArray(captionsArray)) {
                        console.error('Captions are not in expected array format:', captionsArray);
                        return;
                    }
                    
                    for (let i = 0; i < captionsArray.length; i++) {
                        try {
                            if (!captionsArray[i] || !captionsArray[i].text) {
                                console.warn('Invalid caption at index', i);
                                continue;
                            }
                            
                            const text = captionsArray[i].text;
                            console.log('Processing caption', i, 'with text:', text);
                            
                            const promise = makeFurigana(text)
                                .then((arr) => {
                                    this.ruby(arr, sourceId, i);
                                })
                                .catch((error) => {
                                    console.error('Error in makeFurigana for caption', i, ':', error);
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
                var parsed = this.vttToCaptions(text) || this.assToCaptions(text) || this.srtToCaptions(text);
                if (!parsed)
                    return null;

                this.sortCaptionsByTime(parsed);
                this.mergeDuplicates(parsed);
                var currentOffset = offset;
                for (var i = 0; i < parsed.length; i++) {
                    var caption = parsed[i]
                    caption.id = "id_" + i;
                    if (customOffsets.hasOwnProperty(caption.id)) {
                        caption.customOffset = Utils.parseInputNum(customOffsets[caption.id]);
                        if (i > 0) {
                            var guaranteedGapBetweenLines = 0.002
                            var minCustomOffset = parsed[i - 1].startTime - caption.startTime - currentOffset + guaranteedGapBetweenLines;
                            caption.customOffset = Math.max(caption.customOffset, minCustomOffset);
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
                if (this.shouldHideRegexMatches)
                    this.hideRegexMatches(parsed);
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
                    if (caption.text === nextCaption.text && this.isOverlapping(caption, nextCaption)) {
                        nextCaption.startTime = Math.min(caption.startTime, nextCaption.startTime)
                        nextCaption.endTime = Math.max(caption.endTime, nextCaption.endTime)
                        duplicateIndexes.push(i);
                    } else if (caption.startTime === nextCaption.startTime && caption.endTime === nextCaption.endTime) {
                        nextCaption.text = caption.text + '\n' + nextCaption.text;
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
                    var previousCaptions = this.findPreviousCaptions(captions, caption, i);

                    var self = this;
                    var takenLanes = previousCaptions
                        .filter(function (prev) { return self.isOverlapping(prev, caption); })
                        .map(function (c) { return c.lane; });

                    for (var lane = 0; lane < takenLanes.length + 1; lane++) {
                        if (takenLanes.indexOf(lane) === -1) {
                            caption.lane = lane;
                            break;
                        }
                    }

                    if (!caption.lane)
                        caption.lane = 0;

                    caption.neededNewlines = this.calculateNeededNewlines(caption, previousCaptions);
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
                    var newlinesByLane = captionsBelow.reduce(function (map, caption) {
                        var newlines = self.newlineCount(caption.text)
                        if (!map.hasOwnProperty(caption.lane))
                            map[caption.lane] = newlines
                        else
                            map[caption.lane] = Math.max(newlines, map[caption.lane])
                        return map;
                    }, {}) || {};

                    var newlineCounts = Object.values(newlinesByLane)
                    return newlineCounts.reduce(function (a, b) { return a + b; }, 0) + newlineCounts.length;
                }
            },

            newlineCount: function (text) {
                return (text.match(/\n/g) || []).length
            },

            // If 2 subtitles only overlap for like a few milliseconds, I don't
            // want the second subtitle to float in mid-air; I'd rather just show the 
            // second one when the first one is finished.
            isOverlapping: function (leftCaption, rightCaption) {
                var rightContainedDuration = leftCaption.endTime - rightCaption.startTime;
                var rightDuration = rightCaption.endTime - rightCaption.startTime;
                return rightContainedDuration > 0.2 || (rightContainedDuration / rightDuration) > 0.3;
            },

            findPreviousCaptions: function (captions, currentCaption, index) {
                var previousCaptions = [];
                var previousCaptionLanes = {};
                var maxLookBehind = 5;
                var misses = 0;
                for (var j = index - 1; j >= 0; j--) {
                    var prevCaption = captions[j];
                    if (prevCaption.lane in previousCaptionLanes && !(prevCaption.startTime < currentCaption.startTime && currentCaption.startTime < prevCaption.endTime)) {
                        misses++;
                        if (misses > maxLookBehind)
                            break;
                        else
                            continue;
                    }

                    previousCaptions.push(prevCaption);
                    previousCaptionLanes[prevCaption.lane] = true;
                }

                previousCaptions.sort(this.compareByLane);

                return previousCaptions
            },

            compareByLane: function (a, b) {
                return a.lane == b.lane ? 0 : (a.lane > b.lane ? 1 : -1);
            },

            increasePlaybackSpeed: function (increase) {
                var videoElement = this.getVideoElement()
                var speed = videoElement.playbackRate
                speed += increase ? 0.05 : -0.05
                speed = parseFloat(speed).toFixed(2);
                if (speed > 3)
                    speed = 3
                else if (speed < 0.25)
                    speed = 0.25

                videoElement.playbackRate = speed
                this.notify(`Playback speed changed to ${speed}`);
            },

            downloadString: function (text, fileType, fileName) {
                var blob = new Blob([text], { type: fileType });
                var a = document.createElement('a');
                a.download = fileName;
                a.target = "_blank";
                a.href = URL.createObjectURL(blob);
                a.dataset.downloadurl = [fileType, a.download, a.href].join(':');
                a.style.display = "none";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
            }
        }
    });
    
    return vm;
}

console.log("Creating app Date: " + new Date().toISOString().replace('T', ' ').replace('Z', ''));
createApp();