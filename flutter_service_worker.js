'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "version.json": "bf7851149a9d5d3232a91fe25d7532d7",
"index.html": "35eeaf325044fe4b9f6328afa40eeb4b",
"/": "35eeaf325044fe4b9f6328afa40eeb4b",
"firebase-messaging-sw.js": "15717026be4bd8d9953f18e1f69aa9e0",
"main.dart.js": "2a2f211eb14ee5862633ce3c92eea713",
"favicon.png": "1671fb3711339c8c62bccb77c62abf16",
"icons/Icon-192.png": "701272d75a4ca9a1cefafafe00e7b4fb",
"icons/Icon-512.png": "78c998aded2b93220db3160b7386b16c",
"manifest.json": "29cff9060ac694d84fe2f76874dfb32b",
"assets/images/bed.svg": "25d0ca72457cc3d2fad9b29471088157",
"assets/images/bathroom.svg": "ade9fc07d35c72d76adcfd8055ffb908",
"assets/images/hallway.svg": "f33ae884e3585d656b6697398f328a1f",
"assets/images/exterior.svg": "1da2641dcaebcf7e1d53383cae6726d6",
"assets/images/ic_user.jpg": "7eb114b8705e92fb1a703ea4df9bb247",
"assets/images/radar.svg": "9b2606686fef294e5f58857c2318c6ba",
"assets/images/radar.png": "3bde60bec5ff5e0fef156fcabad1b075",
"assets/images/utility.svg": "7318d4c7150fcd208a1ee3169de56b06",
"assets/images/lounge.svg": "2baae934aec4d4b9db3bf485313682f7",
"assets/images/img.jpg": "60e617c3b5a9ebe9a6f2d8f9cd15f3b8",
"assets/images/survey.svg": "fa891050c75f6d9d39b83cd7a54d36de",
"assets/images/logo.png": "e8e6e22bbaf1a17f19fee871c17be869",
"assets/images/toilet.svg": "ee440811030a9f00e0abd683cb9378a3",
"assets/images/bed_image.svg": "0b3c29bcbdbca5945e38d441e86d9417",
"assets/images/kitchen.svg": "7aad0749e0388aab82f518b5f5e057e6",
"assets/images/attach.svg": "67aa9672351f733a652b4d0090c5a0a7",
"assets/images/default.png": "28be6e6acb73edc636c846b94709eb50",
"assets/images/garden.svg": "996e73eb6953e52b5d8036a3e3f91053",
"assets/images/image.png": "e28fc57ef1db10cf7378abf93eefe7a3",
"assets/AssetManifest.json": "c70066aa943c78b6dfef400d499455da",
"assets/NOTICES": "5b03cb4aac96a8a28cc5fd53095fbab3",
"assets/FontManifest.json": "dc3d03800ccca4601324923c0b1d6d57",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "6d342eb68f170c97609e9da345464e5e",
"assets/packages/fluttertoast/assets/toastify.js": "e7006a0a033d834ef9414d48db3be6fc",
"assets/packages/fluttertoast/assets/toastify.css": "a85675050054f179444bc5ad70ffc635",
"assets/fonts/MaterialIcons-Regular.otf": "1288c9e28052e028aba623321f7826ac"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value + '?revision=' + RESOURCES[value], {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey in Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
