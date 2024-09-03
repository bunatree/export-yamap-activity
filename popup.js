document.addEventListener('DOMContentLoaded', () => {
  const exportButton = document.getElementById('btn-export');

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = new URL(tabs[0].url);

    // URLが指定のパターンに一致しない場合、ボタンを無効化
    if (!url.hostname.includes('yamap.com') || !url.pathname.startsWith('/activities/')) {
      exportButton.classList.add('disabled');
      exportButton.textContent = 'Not Available';
      exportButton.disabled = true; // ボタンを無効化してクリックできなくする
    } else {
      exportButton.classList.remove('disabled');
      exportButton.textContent = 'Export Activity Data';
      exportButton.disabled = false; // ボタンを有効化
    }
  });

  document.getElementById('btn-export').addEventListener('click', () => {
    const exportButton = document.getElementById('btn-export');

    // ボタンの状態を変更
    exportButton.classList.add('disabled');
    exportButton.textContent = 'Exporting... Please wait.';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'gatherData' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          resetButton();  // エラーがあった場合もボタンを元に戻す
        } else if (response) {
          // ZIP作成・ダウンロード処理を呼び出す
          downloadAsZip(response).then(() => {
            resetButton();  // ZIPダウンロード後にボタンを元に戻す
          }).catch(error => {
            console.error('Failed to download ZIP:', error);
            resetButton();  // エラーがあった場合もボタンを元に戻す
          });
        }
      });
    });
  });

  function fetchPhoto(url) {
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
      `Date: ${activityData.date || ''}`,
      `Days: ${activityData.days || ''}`,
      `Prefecture: ${activityData.prefName || ''}`,
      `Map Name: ${activityData.mapName || ''}`,
      `Title: ${activityData.title || ''}`,
      `Distance: ${activityData.distance || ''}`,
      `Ascent: ${activityData.ascent || ''}`,
      `Descent: ${activityData.descent || ''}`,
      `Description: ${activityData.description || ''}`
    ].join('\n');
    zip.file('details.txt', detailsTxt);

    // ZIP ファイルの生成とダウンロード
    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'activity_data.zip';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ボタンの状態を元に戻す関数
  function resetButton() {
    const exportButton = document.getElementById('btn-export');
    exportButton.classList.remove('disabled');
    exportButton.textContent = 'Export Activity Data';
    exportButton.disabled = false; // ボタンを有効化
  }
});
