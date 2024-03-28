# Maintaining decryption

This folder contains the decryption logic for the primewire provider

The code in `blowfish.ts` is a de-obfuscated version of the original code that is used to decrypt the video links. You can find original the code [in this JavaScript file](https://www.primewire.tf/js/app-21205005105979fb964d17bf03570023.js?vsn=d]) by searching for the keyword "sBox0".

The code is minified, so use prettier to deobfuscate it. In the case that the URL changes, you can find it used in the [primewire homepage](https://www.primewire.tf/).
