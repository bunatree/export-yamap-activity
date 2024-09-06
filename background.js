chrome.runtime.onInstalled.addListener(() => {
  console.log("YAMAP Activity Export Tool installed.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchPhoto') {
    fetch(request.url)
      .then(response => response.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // BLOB を base64 エンコードして送信
          sendResponse({ blob: reader.result });
        };
        // BLOB を base64 エンコード
        reader.readAsDataURL(blob);
      })
      .catch(error => {
        console.error('Error fetching photo:', error);
        sendResponse({ error: error.message });
      });
    // 非同期応答を維持するために true を返す
    return true;
  }
});
