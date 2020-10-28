# obsidian-url-into-selection

Insert links into a selected text "notion-style".

The default hotkey is `ctrl + shift + v`, if you want to change it to "classic" `ctrl + v`, 
be aware that you will lose an ability to quickly "paste" attachments into Obsidian editor.


![example](https://user-images.githubusercontent.com/4748206/97376946-665f1d00-18c7-11eb-8fd8-de2976fcdb47.gif)

### Installation


#### Prerequisites

- Obsidian 0.9.7 (Plugin API alpha release) is installed
- Support for 3rd party plugins is enabled in settings (Obsidian > Settings > Third Party plugin > Safe mode - OFF)


To install this plugin, download `zip` archive from [GitHub releases page](https://github.com/denolehov/obsidian-url-into-selection/releases).
Extract the archive into `<vault>/.obsidian/plugins`.

Alternatively, using bash:
```bash
OBSIDIAN_VAULT_DIR=/path/to/your/obsidian/vault

# create plugins directory if it's not yet there
mkdir -p $OBSIDIAN_VAULT_DIR/.obsidian/plugins

# unzip `main.js` and `manifest.json` into a plugin directory
unzip ~/Downloads/obsidian-url-into-selection_v1.0.0.zip -d $OBSIDIAN_VAULT_DIR/.obsidian/plugins
```
