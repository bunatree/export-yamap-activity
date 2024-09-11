document.addEventListener('DOMContentLoaded', () => {
  
  const exportButtonElm = document.getElementById('btn-export');

  // ブラウザーの言語設定を取得
  const userLang = navigator.language || navigator.userLanguage; // 'ja', 'en-US', etc.
  const lang = userLang.startsWith('ja') ? 'ja' : 'en';

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = new URL(tabs[0].url);

    // URLが指定のパターンに一致しない場合、または「日記」のURLの場合、ボタンを無効化
    if (!url.hostname.includes('yamap.com') || !url.pathname.startsWith('/activities/') || url.pathname.includes('/article')) {
      exportButtonElm.classList.add('disabled');
      exportButtonElm.textContent = i18n[lang].btn_label_unavailable;
      exportButtonElm.disabled = true;
    } else {
      exportButtonElm.classList.remove('disabled');
      exportButtonElm.textContent = i18n[lang].btn_label_available;
      exportButtonElm.disabled = false;
    }
  });

  document.getElementById('btn-export').addEventListener('click', () => {

    const exportButtonElm = document.getElementById('btn-export');

    // ボタンの状態を変更
    exportButtonElm.classList.add('disabled');
    exportButtonElm.textContent = i18n[lang].btn_label_exporting;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'gatherData' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          resetButton();  // エラーがあった場合もボタンを元に戻す
        } else if (response) {
          // ZIP作成・ダウンロード処理を呼び出す
          downloadAsZip(response).then(() => {
            resetButton(); // ZIPダウンロード後にボタンを元に戻す
            downloadGpx(); // GPXファイルのダウンロードを試みる
          }).catch(error => {
            console.error('Failed to download ZIP:', error);
            resetButton();  // エラーがあった場合もボタンを元に戻す
          });
        }
      });
    });
  });

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function fetchPhoto(url) {
    await delay(100); // 0.1秒のウェイト（不要かも）
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'fetchPhoto', url: url }, (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.blob);
        }
      });
    });
  }

  async function downloadAsZip(activityData) {
    const zip = new JSZip();
    // activityData を JSON ファイルとして追加
    zip.file('activity.json', JSON.stringify(activityData, null, 2));

    // 写真の取得と追加
    for (let i = 0; i < activityData.photos.length; i++) {
      const photo = activityData.photos[i];
      try {
        const base64DataUrl = await fetchPhoto(photo.url);
        const response = await fetch(base64DataUrl);
        const blob = await response.blob();

        // 3桁または必要に応じて4桁のファイル名を生成
        const photoNumber = String(i + 1).padStart(activityData.photos.length.toString().length, '0');
        zip.file(`image${photoNumber}.jpg`, blob);
        await delay(100); // 0.1秒のウェイト（不要かも）
      } catch (error) {
        console.error('Failed to fetch photo:', error);
      }
    }

    // photos.txt と details.txt の生成
    const photosTxt = activityData.photos.map((photo, i) => {
      const photoNumber = String(i + 1).padStart(activityData.photos.length.toString().length, '0');
      return `image${photoNumber}.jpg\n${photo.memo}\n`;
    }).join('\n');
    zip.file('photos.txt', photosTxt);

    const detailsTxt = [
      `Title: ${activityData.title || ''}`,
      `URL: ${activityData.url || ''}`,
      `Date: ${activityData.date || ''}`,
      `Days: ${activityData.days || ''}`,
      `User Name: ${activityData.userName || ''}`,
      `Prefecture: ${activityData.prefName || ''}`,
      `Map Name: ${activityData.mapName || ''}`,
      `Tags: ${activityData.tags || ''}`,
      `Distance: ${activityData.distance || ''}`,
      `Ascent: ${activityData.ascent || ''}`,
      `Descent: ${activityData.descent || ''}`,
      `Description: ${activityData.description || ''}`,
    ].join('\n');
    zip.file('details.txt', detailsTxt);

    // ZIP ファイルの生成とダウンロード
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    // 日付からドット記号と(曜日)を削除
    const activityDate = activityData.date.replace(/\./g, '-').replace(/\(.+\)/, '');
    const activityId = new URL(activityData.url).pathname.split('/').pop();
    // ファイル名は yamap_YYYY-MM-DD_ActivityId.zip 
    a.download = `yamap_${activityDate}_${activityId}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ボタンの状態を元に戻す
  function resetButton() {
    const exportButtonElm = document.getElementById('btn-export');
    exportButtonElm.classList.remove('disabled');
    exportButtonElm.textContent = i18n[lang].btn_label_available;
    exportButtonElm.disabled = false; // ボタンを有効化
  }

  // GPXファイルのダウンロードを試みる
  function downloadGpx() {
    if (window.confirm(i18n[lang].msg_confirm_download_gpx)) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'downloadGpx' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Failed to send message to download GPX:', chrome.runtime.lastError.message);
          } else {
            console.log('GPX download triggered successfully.');
          }
        });
      });
    }
  }
  
});
