# Paste URL into selection

Insert links (URLs) into a selected text "notion-style" using regular `Ctrl/Cmd + V`

Also works the other way around, inserts text into a selected link (URL) by command palette/hotkey(need to be set manually)

## Demo
![example](https://user-images.githubusercontent.com/4748206/98997874-ed55fb80-253d-11eb-9121-709a316a4d1e.gif)

## Compatibility
Custom plugins are only available for Obsidian v0.9.8+.

# Installation
In order to install this plugin, go to "Settings > Third Party Plugins > Paste URL into selection".

If you have any kind of feedback or questions, feel free to reach out via GitHub issues or `@evrwhr` on [Obsidian Discord server](https://discord.com/invite/veuWUTm).

---

### Settings
To edit settings, open `Settings > Plugin Options > Paste URL into selection`

#### 1. Fallback regular expression (uses `RegExp`)
You can add Regular expressions of any style you want `[Highlighted Text](clipboard text/url)`

##### Common Expressions
| title | RegExp | description |
|-------|------|-------------|
| *default* | `[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)` | URL starts with HTTP/HTTPS |


#### 2. Behavior on pasting URL when nothing is selected
You can still use this plugin to do things when nothing is selected. *This only works when a url is copied to clipboard.*
1. `Do nothing` **default**
2. `Auto Select` If you have a URL copied to your clipboard, it has the same behavior as first selecting the closest word to your cursor and turning it into a URL, or Embeded url (depending on your settings). Now, you don't need to select text, but you still can.
3. `Insert [](url)` This is useful when you want to paste a link, and then add text for it. It'll position the cursor
4. `Insert <url>` This just inserts `<` and `>` characters around your clipboard url and pastes it where the cursor is selected.

#### 3. Whitelist for image embed syntax
You can add Regular expressions of any style of clipboard text you want, specially for embedding files in the format `![Highlighted Text](clipboard text/url)`

##### Common Expressions
| title | RegExp | description |
|-------|------|-------------|
| *default* |  | Nothing is whitelisted |
| image links | `(?:([^:/?#]+):)?(?://([^/?#]*))?([^?#]*\.(?:jpg|gif|png))(?:\?([^#]*))?(?:#(.*))?` | Embeds images that have a .jpg|gif|png extension |
| YT/Vimeo | `youtu.?be|vimeo` | Embeds YouTube and Vimeo links *(doesn't seem to currently show in Obsidian app)*|

#### My Favorite Setting Selections:
1. Leave as default: `[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)`
2. Switch to `Auto Select`
3. Add image link regex: `(?:([^:/?#]+):)?(?://([^/?#]*))?([^?#]*\.(?:jpg|gif|png))(?:\?([^#]*))?(?:#(.*))?`

---

> If you like what I do, you could consider buying me a coffee. It is unnecessary, but appreciated :) https://www.buymeacoffee.com/evrwhr
