# YAMAP Activity Exporter
## YAMAPの活動日記をエ クスポートする Chrome 拡張機能

この Chrome 拡張機能は、YAMAP の活動日記（ヤマレコで言うところの山行記録）をエクスポートします。

自分の活動日記を手軽にバックアップする目的で制作しました。

エクスポートされたデータは、シンプルなテキストと JPEG ファイルで構成されます。ご自分のブログや他社サービスへの転載にもご利用いただけると思います。

## 拡張機能のインストール手順

### 1. ダウンロード

この拡張機能の最新バージョンは以下のリンクからダウンロードできます。

[YAMAP Activity Exporter v1.0.0](https://github.com/bunatree/export-yamap-activity/releases/download/v1.0.0/export-yamap-activity-1.0.0.zip)

ダウンロードした zip ファイルを展開し、任意のフォルダにコピーしてください。

### 2. ブラウザへのインストール

Chrome または Edge ブラウザを起動します。

アドレスバーに chrome://extensions/ と入力するか、[設定] (右上の3つのドットアイコン) > [拡張機能] > [拡張機能を管理] を選択し、拡張機能ページを表示します。

当拡張機能の古いバージョンがインストール済みの場合は、先に古いバージョンをアンインストールしてください。

「デベロッパーモード」をオンにします。

「パッケージ化されていない拡張機能を読み込む」をクリックして、当拡張機能をコピーしたフォルダを選択します。

拡張機能のリストに「YAMAP Activity Exporter」が表示されることを確認します。

ブラウザを再起動します。

## 使い方

ブラウザーで YAMAP の活動日記のページを開き、拡張機能のアイコンをクリックすると、「Export Activity Data」というボタンが表示されます。

ボタンがクリックされると、活動日記のデータを取得開始します。データ取得中はボタンの表記が「Exporting... Please wait.」となります。

取得が終了すると、zipファイルとしてエクスポート（ダウンロード）します。

エクスポートされるデータには次のものが含まれます。

-テキストデータ
  - 活動日記のタイトル
  - 日付
  - 行動日数
  - 都道府県
  - 地図の名前
  - 行動時間
  - 累積標高（上り、下り）
  - 詳細（感想文）
- 写真
  - 画像ファイル (JPEG)
  - 写真のメモ (テキスト)

GPX ファイルはエクスポートされません。活動日記ページ上のボタンをクリックして手動で別途エクスポートしてください。

## ライセンス

この拡張機能は、次のライブラリや画像を使用しています。

[JSZip ライブラリ](https://stuk.github.io/jszip/ "JSZip") … JSZip は MIT ライセンスで配布されています。

[Triangle icons created by Iconpro86 - Flaticon](https://www.flaticon.com/free-icons/triangle "triangle icons") … Free for personal and commercial purpose with attribution.

## 動作確認

Browser: Google Chrome 128.0.6613.120 (Official Build) (arm64)

OS: macOS バージョン14.6.1（ビルド23G93）

