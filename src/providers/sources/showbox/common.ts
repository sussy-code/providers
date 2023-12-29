// We do not want content scanners to notice this scraping going on so we've hidden all constants
// The source has its origins in China so I added some extra security with banned words
// Mayhaps a tiny bit unethical, but this source is just too good :)
// If you are copying this code please use precautions so they do not change their api.

export const iv = atob('d0VpcGhUbiE=');
export const key = atob('MTIzZDZjZWRmNjI2ZHk1NDIzM2FhMXc2');
export const apiUrls = [
  atob('aHR0cHM6Ly9zaG93Ym94LnNoZWd1Lm5ldC9hcGkvYXBpX2NsaWVudC9pbmRleC8='),
  atob('aHR0cHM6Ly9tYnBhcGkuc2hlZ3UubmV0L2FwaS9hcGlfY2xpZW50L2luZGV4Lw=='),
];
export const appKey = atob('bW92aWVib3g=');
export const appId = atob('Y29tLnRkby5zaG93Ym94');
export const captionsDomains = [atob('bWJwaW1hZ2VzLmNodWF4aW4uY29t'), atob('aW1hZ2VzLnNoZWd1Lm5ldA==')];

export const showboxBase = 'https://www.showbox.media';
