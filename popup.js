// ブラウザーの言語設定を取得
const userLang = navigator.language || navigator.userLanguage; // 'ja', 'en-US', etc.
const lang = userLang.startsWith('ja') ? 'ja' : 'en';

document.addEventListener('DOMContentLoaded', () => {

  // ページタイトル設定
  const toolNameElm = document.querySelector('#page-title .tool-name');
  toolNameElm.textContent = i18n[lang].page_title_popup;

  const exportButtonElm = document.querySelector('.btn-export');

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = new URL(tabs[0].url);

    // URLが指定のパターンに一致しない場合、または「日記」のURLの場合、ボタンを無効化
    if (!url.hostname.includes('yamap.com') || !url.pathname.startsWith('/activities/') || url.pathname.includes('/article')) {
      exportButtonElm.classList.remove('btn-primary');
      exportButtonElm.classList.add('btn-secondary');
      exportButtonElm.textContent = i18n[lang].btn_label_unavailable;
      exportButtonElm.disabled = true;
      hideButtonArea();
      showAlert(i18n[lang].btn_label_unavailable,'info',false);
    } else {
      exportButtonElm.classList.remove('btn-secondary');
      exportButtonElm.classList.add('btn-primary');
      exportButtonElm.innerHTML = '<i class="bi bi-download"></i>&nbsp;<span class="btn-label flex-grow-1">' + i18n[lang].btn_label_available + '</span>';
      exportButtonElm.disabled = false;
      showButtonArea();
      hideAlert();
    }
  });

  exportButtonElm.addEventListener('click', () => {

    exportButtonElm.classList.remove('btn-primary');
    exportButtonElm.classList.add('btn-secondary');
    exportButtonElm.textContent = i18n[lang].btn_label_exporting;
    exportButtonElm.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'gatherData' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          showAlert(chrome.runtime.lastError.message,'warning',false);
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

});

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPhoto(url) {
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

  // 写真取得時の待ち時間（ミリ秒）
  const delayMs = 500;

  const zip = new JSZip();

  // activityData を JSON ファイルとして追加
  zip.file('activity.json', JSON.stringify(activityData, null, 2));

  // JSONファイル処理完了メッセージ
  // (一瞬なので、まず見えないけど)
  showAlert(i18n[lang].msg_completed_saving_json_file, 'success', false);

  // 写真をループ処理
  for (let i = 0; i < activityData.photos.length; i++) {
    const photo = activityData.photos[i];
    try {

      const base64DataUrl = await fetchPhoto(photo.url);
      const response = await fetch(base64DataUrl);
      const blob = await response.blob();

      const photoNumber = String(i + 1).padStart(activityData.photos.length.toString().length, '0');

      // アクティブなタブに処理中の画像ファイル情報を送信
      // (アクティブなタブのコンソールに出力)
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { message: `Saving ${photo.url} as image${photoNumber}.jpg...` });
      });

      // 処理中の画像ファイル情報を表示
      showAlert(i18n[lang].msg_saving_image_before + 'image' + photoNumber + '.jpg' + i18n[lang].msg_saving_image_after, 'success', false);

      zip.file(`image${photoNumber}.jpg`, blob);

      // 1秒待ってから次の画像を処理する
      await delay(delayMs);

    } catch (error) {
      msgElm.innerText = 'Failed to fetch photo: ' + error;
      console.error('Failed to fetch photo:', error);
    }
  }

  // 画像処理完了メッセージ
  // (一瞬なので、まず見えないけど)
  showAlert(i18n[lang].msg_completed_saving_images, 'success', false);

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
    `Calories: ${activityData.calorie || ''}`,
    `Description: ${activityData.description || ''}`,
  ].join('\n');

  zip.file('details.txt', detailsTxt);

  // テキスト情報保存完了メッセージ
  // (一瞬なので、まず見えないけど)
  showAlert(i18n[lang].msg_saved_text_info_files, 'success', false);

  // メッセージをクリア
  showAlert(i18n[lang].msg_export_completed, 'success', true);

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

function showButtonArea() {
  const buttonAreaElm = document.getElementById('button-area');
  buttonAreaElm.classList.remove('d-none');
}

function hideButtonArea() {
  const buttonAreaElm = document.getElementById('button-area');
  buttonAreaElm.classList.add('d-none');
}

function showAlert(htmlContent, type, autoHide) {
  const alertDivElm = document.getElementById('alert');
  alertDivElm.classList.remove('d-none','alert-primary','alert-secondary','alert-success','alert-info','alert-warning');
  alertDivElm.classList.add('alert-' + type);
  alertDivElm.innerHTML = htmlContent;
  if (autoHide) {
    fadeOut(alertDivElm,2000);
  }
}

function hideAlert() {
  const alertDivElm = document.getElementById('alert');
  alertDivElm.classList.add('d-none');
}

function fadeOut(elm,waitMs) {
  setTimeout(() => {
    elm.style.transition = 'opacity 1s';
    elm.style.opacity = '0';
    setTimeout(() => {
      elm.classList.add('d-none');
      elm.style.opacity = '1';
    }, 1000);
  }, waitMs);
}

// ボタンの状態を元に戻す
function resetButton() {
  const exportButtonElm = document.querySelector('.btn-export');
  exportButtonElm.classList.remove('btn-secondary');
  exportButtonElm.classList.add('btn-primary');
  exportButtonElm.innerHTML = '<i class="bi bi-download"></i>&nbsp;<span class="btn-label flex-grow-1">' + i18n[lang].btn_label_available + '</span>';
  exportButtonElm.disabled = false;
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
