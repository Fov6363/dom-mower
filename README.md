# DOM Mower

English | [简体中文](README.zh-CN.md)

Turn the webpage you are viewing into a lightweight survivor game. Web elements become enemies, and the page structure becomes the level.

DOM Mower is a build-free Chrome Manifest V3 extension that can be installed locally. All game logic runs on your device. It requires no account, server, or network access, and it never reads the text content of the page.

## Download

[Download DOM Mower v0.3.0 (ZIP)](https://github.com/Fov6363/dom-mower/releases/download/v0.3.0/dom-mower-v0.3.0.zip)

Extract the ZIP before installing it. Chrome cannot install a regular ZIP directly, so the extension must be loaded as an unpacked extension.

## Install and Play

1. Download and extract the ZIP above.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the extracted `dom-mower-v0.3.0` directory.
5. Open a regular webpage. A Wikipedia article is a good place to start.
6. Click the DOM Mower icon in the Chrome toolbar to start the game.

Click the extension icon again, click **Exit Game** in the top-right corner, or press `Esc` to stop the game and restore the page.

## Gameplay

- Move with `WASD` or the arrow keys, or click anywhere to move toward that position.
- Piercing projectiles automatically attack the nearest web element, while three orbiting blades deal close-range damage.
- Press `1` or `⌘/Ctrl+F` to use **Find**, chaining attacks across matching DOM elements.
- Press `2` or `⌘/Ctrl+X` to use **Cut**, collecting nearby elements in the clipboard.
- Press `3` or `⌘/Ctrl+V` to use **Paste**, turning collected fragments into piercing or explosive attacks.
- Destroy elements to collect experience. Each level-up offers CSS and DOM rules such as `a`, `img`, `>`, `+`, `.class`, and `!important`.
- Buttons fire red projectiles at the player.
- After text, form controls, and images are cleared, large panels with backgrounds, borders, or shadows become elite enemies.
- When no enemies remain, the game scans the viewport again before showing **Next Level**.
- **Next Level** scrolls down by roughly 80% of the viewport and generates a new wave. Reaching the bottom of the page completes the run.

## Permissions and Privacy

DOM Mower requests only these permissions:

- `activeTab`: reads the position and type of visible elements after you click the extension icon.
- `scripting`: injects the game logic and styles into the active tab.
- `storage`: stores local game progress and settings.

The extension does not request persistent access to every website. It contains no network requests, analytics SDKs, or user tracking. All temporary styles and game UI are removed when you exit the game.

## Current Limitations

- Only the main page scrollbar is supported; independently scrolling containers are not.
- Text content is never read. Enemies are generated only from element tags, positions, and dimensions.
- Cross-origin iframes, Shadow DOM, video, and Canvas elements are not supported.
- Chrome does not allow extensions to run on internal pages such as `chrome://`.
- On pages with aggressive CSS animations, the hit reaction may conflict with existing effects. Temporary classes are still removed when the game exits.

## Development

The project uses vanilla JavaScript, Canvas 2D, and CSS, with no dependencies or build step. Clone the source with `git clone https://github.com/Fov6363/dom-mower.git`. After making changes, reload the extension from `chrome://extensions`.

## License

[MIT](LICENSE)
