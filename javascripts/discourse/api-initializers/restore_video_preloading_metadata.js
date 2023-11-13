import { withPluginApi } from "discourse/lib/plugin-api";
import { iconHTML } from "discourse-common/lib/icon-library";
import discourseLater from "discourse-common/lib/later";
import I18n from "I18n";

// Replace:
// -
// <div class="video-placeholder-container" data-video-src="...">
//   <div class="video-placeholder-wrapper">
//     <div class="video-placeholder-overlay">
//       ...
//     </div>
//   </div>
// </div>
//
// To:
// -
// <div class="video-container" data-video-src="...">
//   <video width="100%" height="100%" preload="metadata" controls>
//     <source src="..." ...>
//     <a href="...">...</a>
//   </video>
// </div>
//
function handleVideoContainer(element, owner) {
  element
    .querySelectorAll(".video-placeholder-container")
    .forEach((videoContainer) => {
      videoContainer.classList.replace(
        "video-placeholder-container",
        "video-container"
      );

      videoContainer.innerHTML = `
        <video width="100%" height="100%" preload="metadata" controls>
          <source src="${videoContainer.dataset.videoSrc}" ${videoContainer.dataset.origSrc}>
          <a href="${videoContainer.dataset.videoSrc}">${videoContainer.dataset.videoSrc}</a>
        </video>`;

      const caps = owner.lookup("service:capabilities");
      if (caps.isSafari || caps.isIOS) {
        const source = videoContainer.querySelector("source");
        if (source) {
          // In post-cooked.js, we create the video element in a detached DOM
          // then adopt it into to the real DOM.
          // This confuses safari, and preloading/autoplay do not happen.

          // Calling `.load()` tricks Safari into loading the video element correctly
          source.parentElement.load();
        }
      }

      const video = videoContainer.getElementsByTagName("video")[0];

      video.addEventListener("loadeddata", () => {
        discourseLater(() => {
          if (video.videoWidth === 0 || video.videoHeight === 0) {
            const notice = document.createElement("div");
            notice.className = "notice";
            notice.innerHTML =
              iconHTML("exclamation-triangle") +
              " " +
              I18n.t("cannot_render_video");

            videoContainer.appendChild(notice);
          }
        }, 500);
      });
    });
}

export default {
  initialize(owner) {
    withPluginApi("0.8.7", (api) => {
      api.decorateCookedElement(
        (element) => handleVideoContainer(element, owner),
        { onlyStream: true }
      );
    });
  },
};
