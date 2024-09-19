async function gatherActivityData() {

  const date = document.querySelector('.ActivityDetailTabLayout__Middle__Date')?.textContent.trim();
  const days = document.querySelector('.ActivityDetailTabLayout__Middle__Days')?.textContent.trim();

  const userName = document.querySelector('.ActivityDetailTabLayout__UserName')?.textContent.trim();

  const prefName = Array.from(document.querySelectorAll('.ActivityDetailTabLayout__Middle__Prefecture'))
    .map(pref => pref.innerText.trim())
    .join(' ');

  const tags = Array.from(document.querySelectorAll('.ActivitiesId__Misc__Tag'))
  .map(tag => tag.innerText.trim())
  .join(' ');

  const mapName = document.querySelector('.ActivityDetailTabLayout__MapName')?.textContent.trim();
  const title = document.querySelector('.ActivityDetailTabLayout__Title')?.textContent.trim();
  const distance = document.querySelector('#activity-record-value-distance')?.textContent.trim();
  const ascent = document.querySelector('#activity-record-value-cumulative-up')?.textContent.trim();
  const descent = document.querySelector('#activity-record-value-cumulative-down')?.textContent.trim();
  const calorie = document.querySelector('.ActivityRecord__Calorie .ActivityRecord__Score')?.textContent.trim();
  const description = document.querySelector('.ActivitiesId__Description__Body')?.textContent.trim();

  const url = window.location.href;

  // 写真情報の取得
  const photos = Array.from(document.querySelectorAll('.ActivitiesId__Photo')).map(figure => {

    const img = figure.querySelector('img');
    const caption = figure.querySelector('figcaption')?.textContent.trim();
    
    return {
      // data-src属性があれば使い、なければsrc属性を使う
      url: (img.getAttribute('data-src') || img.src).replace(/\?.*/, ''),
      // figurecaptionがあればその内容を取得し、なければimg.altを使う
      memo: caption || img.alt
    };

  });

  // console.log({ date, days, userName, prefName, mapName, title, url, distance, ascent, descent, calorie, description, tags, photos });

  return {
    date, days, userName, prefName, mapName, title, url, distance, ascent, descent, calorie, description, tags, photos
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

  if (request.action === 'downloadGpx') {
    const gpxButton = document.querySelector('.ActivitiesId__Misc__DownloadButton');
    if (gpxButton) {
      gpxButton.click();
      sendResponse({ success: true });
    } else {
      console.error('GPX download button not found.');
      sendResponse({ error: 'GPX download button not found.' });
    }
  }

  // メッセージをコンソールに出力
  if (request.message) {
    console.log(request.message);
  }

});
