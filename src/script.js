// Copyright 2018 Google LLC
// Copyright 2021 SoftwerkZ.de
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

function findLargestPlayingVideo() {
  const videos = findAllVideos()
    .filter(video => video.readyState != 0)
    .sort((v1, v2) => {
      const v1Rect = v1.getClientRects()[0]||{width:0,height:0};
      const v2Rect = v2.getClientRects()[0]||{width:0,height:0};
      return ((v2Rect.width * v2Rect.height) - (v1Rect.width * v1Rect.height));
    });

  if (videos.length === 0) {
    return;
  }

  return videos[0];
}

function findAllVideos() {
  let allVideos = [];
  visit_nodes_recursive(node => {
    if ('tagName' in node && node.tagName.toLowerCase() == 'video')
      allVideos.push(node);
  });
  return allVideos;
}

function visit_nodes_recursive(callback, node) {
  node = node || document;
  callback.call(null, node);
  if (node.firstChild)
    visit_nodes_recursive(callback, node.firstChild);
  if (node.nextSibling)
    visit_nodes_recursive(callback, node.nextSibling);
  if (node.shadowRoot)
    visit_nodes_recursive(callback, node.shadowRoot);
}

async function requestPictureInPicture(video) {
  await video.requestPictureInPicture();
  video.setAttribute('__pip__', true);
  video.addEventListener('leavepictureinpicture', event => {
    video.removeAttribute('__pip__');
  }, { once: true });
  new ResizeObserver(maybeUpdatePictureInPictureVideo).observe(video);
}

function maybeUpdatePictureInPictureVideo(entries, observer) {
  const observedVideo = entries[0].target;
  if (!document.querySelector('[__pip__]')) {
    observer.unobserve(observedVideo);
    return;
  }
  const video = findLargestPlayingVideo();
  if (video && !video.hasAttribute('__pip__')) {
    observer.unobserve(observedVideo);
    requestPictureInPicture(video);
  }
}

(async () => {
  const video = findLargestPlayingVideo();
  if (!video) {
    return;
  }
  if (video.hasAttribute('__pip__')) {
    document.exitPictureInPicture();
    return;
  }
  await requestPictureInPicture(video);
  chrome.runtime.sendMessage({ message: 'enter' });
})();
