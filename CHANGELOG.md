# Changelog
All notable changes to this project will be documented in this file.

## 1.0.5
- Smaller refactorings and improved code
- Title / card header can now be hidden by just assigning an empty value / null ([#15])
- Fixed: Non-functional buttons ([#9], [#16] - thanks to [@adamhun94])
- Fixed: Horizontal resizing of textarea may cause glitches ([#14] - thanks to [@ildar170975])
- Fixed: Buttons are not centered ([#13])
- Fixed: Clipboard behaviour
- Enhancement: Autosave behaviour (not firing on every keyup anymore)
- Removed `textarea` `margin-top` and replaced the JS resizing by flex CSS
- Enhancement: Introduced `min_lines_displayed` option to set the minimal displayed height (lines/rows) of the textbox, defaults to 2 ([#6])
- Enhancement: Stretch to full size of parent container in order to fit in stack cards ([#6])

## 1.0.4
- Added the possibility to rearrange the buttons ([#2])
- Added the possibility to display success messages of backend calls

## 1.0.3
- Fixed HA 0.116 compatibility issue ([#3])

## 1.0.2
- Clear text bugfix ([#1])

## 1.0.1
- Readme + description

## 1.0.0

- **Initial release**

[#1]: /../../issues/1
[#2]: /../../issues/2
[#3]: /../../issues/3
[#6]: /../../issues/6
[#9]: /../../issues/9
[#13]: /../../issues/13
[#14]: /../../issues/14
[#15]: /../../issues/15
[#16]: /../../issues/16
[@adamhun94]: https://github.com/adamhun94
[@ildar170975]: https://github.com/ildar170975