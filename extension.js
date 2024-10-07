const St = imports.gi.St;
const Main = imports.ui.main;
const Clutter = imports.gi.Clutter;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Me = imports.misc.extensionUtils.getCurrentExtension();

const quranData = [{
        "name": "الفاتحة",
        "src": "https://server13.mp3quran.net/husr/001.mp3"
    },
    {
        "name": "البقرة",
        "src": "https://server13.mp3quran.net/husr/002.mp3"
    },
    {
        "name": "آل عمران",
        "src": "https://server13.mp3quran.net/husr/003.mp3"
    },
    {
        "name": "النساء",
        "src": "https://server13.mp3quran.net/husr/004.mp3"
    },
    {
        "name": "المائدة",
        "src": "https://server13.mp3quran.net/husr/005.mp3"
    },
    {
        "name": "الأنعام",
        "src": "https://server13.mp3quran.net/husr/006.mp3"
    },
    {
        "name": "الأعراف",
        "src": "https://server13.mp3quran.net/husr/007.mp3"
    },
    {
        "name": "الأنفال",
        "src": "https://server13.mp3quran.net/husr/008.mp3"
    },
    {
        "name": "التوبة",
        "src": "https://server13.mp3quran.net/husr/009.mp3"
    },
    {
        "name": "يونس",
        "src": "https://server13.mp3quran.net/husr/010.mp3"
    },
    {
        "name": "هود",
        "src": "https://server13.mp3quran.net/husr/011.mp3"
    },
    {
        "name": "يوسف",
        "src": "https://server13.mp3quran.net/husr/012.mp3"
    },
    {
        "name": "الرعد",
        "src": "https://server13.mp3quran.net/husr/013.mp3"
    },
    {
        "name": "إبراهيم",
        "src": "https://server13.mp3quran.net/husr/014.mp3"
    },
    {
        "name": "الحجر",
        "src": "https://server13.mp3quran.net/husr/015.mp3"
    },
    {
        "name": "النحل",
        "src": "https://server13.mp3quran.net/husr/016.mp3"
    },
    {
        "name": "الإسراء",
        "src": "https://server13.mp3quran.net/husr/017.mp3"
    },
    {
        "name": "الكهف",
        "src": "https://server13.mp3quran.net/husr/018.mp3"
    },
    {
        "name": "مريم",
        "src": "https://server13.mp3quran.net/husr/019.mp3"
    },
    {
        "name": "طه",
        "src": "https://server13.mp3quran.net/husr/020.mp3"
    },
    {
        "name": "الأنبياء",
        "src": "https://server13.mp3quran.net/husr/021.mp3"
    },
    {
        "name": "الحج",
        "src": "https://server13.mp3quran.net/husr/022.mp3"
    },
    {
        "name": "المؤمنون",
        "src": "https://server13.mp3quran.net/husr/023.mp3"
    },
    {
        "name": "النور",
        "src": "https://server13.mp3quran.net/husr/024.mp3"
    },
    {
        "name": "الفرقان",
        "src": "https://server13.mp3quran.net/husr/025.mp3"
    },
    {
        "name": "الشعراء",
        "src": "https://server13.mp3quran.net/husr/026.mp3"
    },
    {
        "name": "النمل",
        "src": "https://server13.mp3quran.net/husr/027.mp3"
    },
    {
        "name": "القصص",
        "src": "https://server13.mp3quran.net/husr/028.mp3"
    },
    {
        "name": "العنكبوت",
        "src": "https://server13.mp3quran.net/husr/029.mp3"
    },
    {
        "name": "الروم",
        "src": "https://server13.mp3quran.net/husr/030.mp3"
    }
];

let myPopup;

const MyPopup = GObject.registerClass(
    class MyPopup extends PanelMenu.Button {
        _init() {
            super._init(0);
            let icon = new St.Icon({
                icon_name: 'security-low-symbolic',
                gicon: Gio.icon_new_for_string(Me.dir.get_path() + '/icon.svg'),
                style_class: 'system-status-icon',
            });
            this.add_child(icon);

            this.isPlaying = false;
            this.player = null;

            this.populateMenu(quranData);
        }

        populateMenu(data) {
            data.forEach(item => {
                let meItem = new PopupMenu.PopupMenuItem(item.name);
                this.menu.addMenuItem(meItem);

                meItem.connect('activate', () => {
                    log(`Clicked on: ${item.name}`);
                    if (this.isPlaying) {
                        this.stopAudio();
                    }
                    this.playAudio(item.src);
                });
            });
        }

        playAudio(url) {
            if (this.player) {
                log('Audio player is already running.');
                this.stopAudio();
                return;
            }

            this.player = new Gio.Subprocess({
                argv: ['gst-launch-1.0', 'playbin', `uri=${url}`],
                flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
            });

            this.player.init(null);

            let stderr = this.player.get_stderr_pipe();

            const checkErrors = () => {
                if (stderr.can_read()) {
                    let buffer;
                    let errorMessages = '';

                    while (stderr.can_read()) {
                        buffer = stderr.read_line(null);
                        errorMessages += buffer + '\n';
                    }

                    if (errorMessages) {
                        log('Error: ' + errorMessages);
                    }
                }
            };

            // Poll for errors using a timeout
            GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
                checkErrors();
                return true; // Continue polling
            });

            this.player.wait_async(null, (proc, result) => {
                try {
                    const exitCode = proc.wait_finish(result);
                    log(`Playback finished with exit code: ${exitCode}`);
                } catch (e) {
                    log('Error finishing playback: ' + e.message);
                } finally {
                    this.isPlaying = false;
                    this.player = null;
                }
            });

            this.player.communicate_utf8(null, null);
            this.isPlaying = true;
            log('Playing audio...');
        }

        stopAudio() {
            if (this.player) {
                log('Stopping audio playback...');
                this.player.force_exit();
                this.player = null;
                this.isPlaying = false;
            } else {
                log('No audio is currently playing.');
            }
        }
    }
);

function enable() {
    myPopup = new MyPopup();
    Main.panel.addToStatusArea('myPopup', myPopup, 1);
}

function disable() {
    myPopup.destroy();
}