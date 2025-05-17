/*
Vue 3 VideoList component using global Vue (CDN).
Expected HTML mount: <div id="app"><video-list></video-list></div>
Requires:
<script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"></script>
<script src="/js/video-list.js"></script>
*/

// Define VideoList component
const VideoList = {
    template: `
    <div class="video-list">
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
        <div v-for="v in files" :key="v.path" class="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 cursor-pointer" :class="{ 'ring-2 ring-blue-500': selectedVideos.has(v.path) }" @click="toggleSelect(v)" @dblclick="emitSelect(v)">
          🎬 {{ v.name }}<br><small>{{ formatSize(v.size) }} • {{ formatDate(v.lastModified) }}</small>
        </div>
      </div>
      <div v-if="videos.length" class="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-800 flex justify-center items-center gap-4">
        <small class="text-gray-400">{{ selectedCount ? selectedCount + ' selected' : 'No selection' }}</small>
        <button class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700" @click="playSelected" :disabled="!selectedCount">Play Selected</button>
        <small class="text-gray-400">Enter=Play • Ctrl+A=Select All</small>
      </div>
    </div>`,
    data() {
      return {
        videos: [],
        selectedVideos: new Set(),
        currentPath: [],
        isLoading: true,
        error: null
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
    methods: {
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
        const sel = this.files.filter(f=>this.selectedVideos.has(f.path));
        if(!sel.length) return;
        if(sel.length===1) this.emit('select', sel[0]); else this.emit('playlist', sel);
        this.clearSelection();
      },
      emitSelect(v) {
        this.emit('select', v);
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
    unmounted() {
      window.removeEventListener('keydown', this.handleKeyDown);
    }
  };
  function createApp() {
    const vm = new Vue({
      el: "#app",
      components: { VideoList }
    });
    return vm;
  }
  // Register and mount app
  createApp().mount('#app');
  