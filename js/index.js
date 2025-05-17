var API_URL = 'http://127.0.0.1:5000'; // Replace with your API URL
var util
var mod
var aDict
var analyze
var wn = console.warn
var subtitlesFileContent

var analyzeFurigana = async function (text, mode = 'A') {
    const url = `${API_URL}/furiganas`;
    const payload = {
        text,
        mode,
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error('An error occurred while analyzing the furigana.');
    }

    const data = await response.json();
    return data;
}

var furiganas = function (captions) {
    console.log(captions);
    let ts = []
    for (let i in captions) {
        let caption = captions[i]
        let text = caption.text
        console.log(i, text, caption);
        ts.push(text)
    }
    analyzeFurigana(ts).then((arr) => {
        console.log(arr);
        for (let i in arr) {
            let caption = arr[i]
            caption.text = `<ruby>`
            for (let t of arr) {
                let kj = t[0]
                let kn = t[1]
                kn = kj == kn ? '' : kn
                caption.text += `${kj}<rt>${kn}</rt>`
            }
            captions[i].text += `</ruby>`
        }
    })
    //document.body.insertAdjacentHTML('beforeend', captions[0].text)
    return captions
}
function createApp() {
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
            displaySidebarCaption: function (text) {
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
                      v-html="displaySidebarCaption(caption.text)">
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
        props: ['captions', 'customOffsets', 'isAutoPauseMode', 'isOffsetMode', 'currentTime'],
        methods: {
            selectCaption: function (caption, offset) {
                this.$emit('select-caption', caption, offset)
            },
            setCustomOffset: function (caption, offset) {
                this.$emit('set-custom-offset', caption, offset)
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
          <div class="captions-container">
            <div class="captions-list" lang="ja">
              <span v-for="(caption, index) in captions" class="caption-controls" :key="caption.id">
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
            </div>
          </div>
        </div>
        `
    });

    var vm = new Vue({
        el: "#app",
        data: {
            videoUrl: null,
            subtitlesFileContent: null,
            subtitlesOffsetInput: "0.0",
            customOffsets: {},
            videoFileName: null,
            subtitlesFileName: null,
            activeCaptionIds: [],
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
            captions: [],
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
                subtitleFontSize: 1.0,
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
                    this.captions = captions;
                    console.log(captions);
                    this.furigana()
                    var uri = "data:text/vtt;charset=utf-8," + encodeURIComponent(vtt)
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
                this.captions.forEach(function (c) { map[c.id] = c; })
                return map;
            },
            activeCaptions: function () {
                if (this.autoPauseCaptions.length > 0)
                    return this.autoPauseCaptions;

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

                var active = this.activeCaptions;
                var activeLanes = active.map(function (c) { return c.lane; });
                var captionsWithUniqueLanes = active.filter(function (c, i) { return activeLanes.indexOf(c.lane) === i });
                captionsWithUniqueLanes.sort(this.compareByLane);
                return captionsWithUniqueLanes;
            },
            displayedLines: function () {
                if (!this.shownCaptions || !this.shouldShowMainCaption)
                    return "";

                var lines = [];
                this.shownCaptions.forEach(function (caption) {
                    var linesToAdd = caption.neededNewlines - lines.length;
                    for (var i = 0; i < linesToAdd; i++) {
                        lines.unshift("");
                    }
                    var captionLines = caption.text.split("\n");
                    if (captionLines.length > 0) {
                        captionLines[0] = "\n" + captionLines[0]
                        captionLines[captionLines.length - 1] = captionLines[captionLines.length - 1] + "\n"
                    }
                    lines = captionLines.concat(lines);
                });

                return lines;
            },
            displayedHtml: function () {
                if (!this.displayedLines)
                    return "";
                return this.displayedLines.map(Utils.wrapInP).join("");
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
                    let videoNG = !self.videoUrl || self.shouldShowVideoError;
                    let sidebarNG = !self.captionsUrl || self.shouldShowSubtitlesError;
                    let eitherNG = videoNG || sidebarNG;
                    var stopEvent = function () {
                        e.preventDefault();
                        e.stopPropagation();
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
                        case 'ArrowLeft':
                        case 'ArrowUp':
                            if (eitherNG)
                                return;
                            stopEvent(e);
                            self.previousCaption();
                            break;
                        case 'ArrowDown':
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
                        case 'b':
                        case 'B':
                            if (sidebarNG)
                                return;
                            if (e.ctrlKey || e.altKey || e.metaKey)
                                return;
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
                        case 'h':
                        case 'H':
                            if (sidebarNG) {
                                self.shouldHideRegexMatches = false;
                                return;
                            }
                            if (e.ctrlKey || e.altKey || e.metaKey)
                                return;
                            stopEvent(e);
                            self.shouldHideRegexMatches = !self.shouldHideRegexMatches;
                            if (self.shouldHideRegexMatches) {
                                self.notify("Parentheses hidden");
                            } else {
                                self.notify("Parentheses shown")
                            }
                            break;
                        case '-':
                            if (eitherNG)
                                return;
                            stopEvent(e);
                            self.savedSettings.subtitleFontSize = Math.max(self.savedSettings.subtitleFontSize - 0.15, 0.1);
                            break;
                        case '=':
                            if (eitherNG)
                                return;
                            stopEvent(e);
                            self.savedSettings.subtitleFontSize = Math.min(self.savedSettings.subtitleFontSize + 0.15, 3.0);
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
                            stopEvent(e);
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

            onVideoSeek: function (event) {
                if (this.scheduledImageCopies > 0) {
                    this.copyImage();
                    this.scheduledImageCopies = Math.max(0, this.scheduledImageCopies - 1);
                }
            },

            getVideoElement: function () {
                return this.$el.querySelector("#ab-video-element");
            },

            onTimeUpdate: function () {
                this.currentTime = this.getCurrentTime();
            },

            getCurrentTime: function () {
                var videoElement = this.getVideoElement();
                return videoElement ? videoElement.currentTime : 0;
            },

            getTotalDuration: function () {
                var videoElement = this.getVideoElement();
                return videoElement ? videoElement.duration : 0;
            },

            setCurrentTime: function (time, shouldPlay) {
                var videoElement = this.getVideoElement();
                if (videoElement) {
                    this.currentTime = time;
                    videoElement.currentTime = time;
                    if (shouldPlay)
                        videoElement.play();
                    else
                        this.pause();
                    this.lastPauseTime = time;
                    this.skipNextAutoPause = false;
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
                if (!ids || !this.captions || !this.captionsMap)
                    return [];

                var self = this;
                return ids.map(function (id) { return self.captionsMap[id] })
            },

            playCaption: function (caption) {
                if (!caption)
                    return;
                this.setCurrentTime(caption.startTime + 0.0001, true);
                // For subtitles that are too close to each other chronologically,
                // setting the active caption here makes sure we don't get stuck on a single
                // caption when hitting the left and right arrow keys
                this.activeCaptionIds = [caption.id];
            },

            replayCaption: function (e) {
                if (!this.captions)
                    return;
                var currentCaptionIds = this.activeCaptionIds;
                this.playCaption(this.activeCaptions[0] || this.captions[0]);
                this.activeCaptionIds = currentCaptionIds;
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

            displayAsVideoTime: function (seconds) {
                return new Date(seconds * 1000).toISOString().substr(11, 8).replace(/^00:/g, '');
            },

            selectCaption: function (caption, offset) {
                var previousTextSelection = this.textSelection;
                this.textSelection = window.getSelection().toString();
                if (this.textSelection.length > 0 && this.textSelection !== previousTextSelection)
                    return;

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
                var tracks = this.getVideoElement().textTracks;
                var track = tracks && tracks[0];
                return track;
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
                var track = this.getTrack();
                if (!track)
                    return;
                track.mode = "hidden";
            },

            onCaptionsCueChange: function (e) {
                var track = this.getTrack();
                if (!track)
                    return;
                track.mode = "hidden";

                var newCaptionIds = Array.prototype.map.call(track.activeCues, function (cue) { return cue.id });
                if (this.isAutoPauseMode)
                    this.handleAutoPauseCaptionUpdate(newCaptionIds);

                if (newCaptionIds.length > 0)
                    this.activeCaptionIds = newCaptionIds;
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
            ruby: function (arr, i) {
                this.captions[i].text = "";

                for (let t of arr) {
                    try {
                        //this.captions[i].text += "<ruby>";
                        let kj = typeof t === "object" ? t[0] : t;
                        let kn = typeof t === "object" ? t[1] : "";
                        kn = kj == kn ? "" : kn;
                        let kja = kj.split('')
                        let j = 1
                        let kna = kn.split('')
                        let ka = []
                        for (let i = 1; i < kja.length; i++) {
                            const k = kja[kja.length - i];
                            const n = kna[kna.length - j]
                            if (k == n) {
                                let e = kja.splice(kja.length - i, 1)
                                kna.splice(kna.length - j, 1)
                                i -= 1
                                j -= 1
                                ka = [e, ...ka]
                            } else {
                                break
                            }
                            j += 1
                        }
                        if (typeof t === 'object') {
                            kn = `<rt>${kna.join('')}</rt>`
                            kj = `<ruby>${kja.join('')}${kn}</ruby>${ka.join('')}`
                        }
                        this.captions[i].text += kj;
                        //this.captions[i].text += "</ruby>";
                    } catch (e) {
                        console.error(e);
                    }
                }

                console.log(i, this.captions[i]);
            },
            furigana: async function (limit = 50) {
                console.log(limit, this.captions);
                tokenizer = await initializeTokenizer()
                const promises = [];
                for (let i in this.captions) {
                    try {
                        const text = this.captions[i].text;
                        console.log(i, promises.length);
                        const promise = makeFurigana(text)
                            .then((arr) => {
                                this.ruby(arr, i);
                            })
                            .catch((error) => {
                                console.error('Error in makeFurigana:', error);
                            });

                        //  promises.push(promise);

                        // Check if the number of promises exceeds 50
                        if (promises.length >= limit) {
                            //    await Promise.all(promises);
                            //    promises.length = 0; // Clear the promises array
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }

                // Wait for any remaining promises to resolve
                // await Promise.all(promises);
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
        },
    });
}