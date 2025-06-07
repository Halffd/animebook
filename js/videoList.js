// Register VideoList component
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
        <button class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700" @click="playSelected" :disabled="!selectedCount">Play Selected</button>
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
      this.isLoading = true;
      this.error = null;
      try {
        const res = await fetch(`/api/videos?path=${encodeURIComponent(path)}`);
        const data = await res.json();
        this.videos = data.videos.sort((a,b) => a.isDirectory === b.isDirectory ? a.name.localeCompare(b.name) : b.isDirectory ? 1 : -1);
      } catch (e) {
        this.error = e.message || 'Failed to load';
      } finally {
        this.isLoading = false;
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
      
      if (selected.length === 1) {
        this.onVideoSelected(selected[0]);
      } else {
        // Emit a playlist of videos
        this.$emit('playlist', selected.map(video => ({
          ...video,
          url: `/videos${video.path.startsWith('/') ? '' : '/'}${video.path}`
        })));
      }
      this.clearSelection();
    },
    emitSelect(v) {
      this.onVideoSelected(v);
    },
    handleKeyDown(e) {
      if(e.key==='Enter' && this.selectedCount) this.playSelected();
      if((e.ctrlKey||e.metaKey)&&e.key==='a'){e.preventDefault();this.selectAll();}
    }
  },
  mounted() {
    this.loadVideos();
    window.addEventListener('keydown', this.handleKeyDown);
  },
  beforeDestroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }
});