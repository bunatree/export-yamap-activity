async function gatherActivityData() {

  const date = document.querySelector('.ActivityDetailTabLayout__Middle__Date')?.textContent.trim();
  const days = document.querySelector('.ActivityDetailTabLayout__Middle__Days')?.textContent.trim();

  const prefName = Array.from(document.querySelectorAll('.ActivityDetailTabLayout__Middle__Prefecture'))
    .map(pref => pref.innerText.trim())
    .join(' ');

  const mapName = document.querySelector('.ActivityDetailTabLayout__MapName')?.textContent.trim();
  const title = document.querySelector('.ActivityDetailTabLayout__Title')?.textContent.trim();
  const distance = document.querySelector('#activity-record-value-distance')?.textContent.trim();
  const ascent = document.querySelector('#activity-record-value-cumulative-up')?.textContent.trim();
  const descent = document.querySelector('#activity-record-value-cumulative-down')?.textContent.trim();

  const description = document.querySelector('.ActivitiesId__Description__Body')?.textContent.trim();

  const gpxButton = document.querySelector('.ActivitiesId__Misc__DownloadButton');

  // 写真情報の取得
  const photos = Array.from(document.querySelectorAll('.ActivitiesId__Photo__Image')).map(img => ({
    // data-src属性があれば使い、なければsrc属性を使う
    url: (img.getAttribute('data-src') || img.src).replace(/\?.*/, ''),
    memo: img.alt
  }));

  // console.log({ date, days, prefName, mapName, title, distance, ascent, descent, description, gpxButton, photos });

  // データをまとめて返す
  return {
    date, days, prefName, mapName, title, distance, ascent, descent, description, gpxButton, photos
  };
}

// メッセージをリッスンして gatherActivityData を呼び出す
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'gatherData') {
    gatherActivityData().then(data => {
      sendResponse(data);
    });
    return true; // 非同期応答を維持するために true を返す
  }
});
