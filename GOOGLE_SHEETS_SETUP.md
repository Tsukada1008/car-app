# Google Sheets 保存設定

## 1. スプレッドシートを作成

Google Drive で新しい Google スプレッドシートを作成します。
シート名は自由です。

## 2. Apps Script を貼り付け

スプレッドシート上部メニューから `拡張機能` -> `Apps Script` を開きます。

`google-apps-script/Code.gs` の内容を、Apps Script の `Code.gs` に貼り付けて保存します。

## 3. Webアプリとしてデプロイ

Apps Script 右上の `デプロイ` -> `新しいデプロイ` を選びます。

- 種類: `ウェブアプリ`
- 実行するユーザー: `自分`
- アクセスできるユーザー: `全員`

デプロイ後に表示される `ウェブアプリ URL` をコピーします。

## 4. index.html にURLを設定

`index.html` の以下の行に、コピーしたURLを入れます。

```js
const DEFAULT_GOOGLE_SHEETS_WEB_APP_URL = '';
```

例:

```js
const DEFAULT_GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/xxxxx/exec';
```

保存後、`index.html` をコミットしてGitHubへpushすると公開版にも反映されます。

## 保存されるデータ

- `daishas`: 代車管理データ
- `loans`: ディーラーナンバー貸出データ

スプレッドシートには `Data` シートが自動作成され、JSON形式で保存されます。

## 注意

現在の実装は仮運用向けです。
同時に複数人が編集した場合、最後に保存した内容が優先されます。

## PDF添付機能

預かり車両・代車の詳細画面で追加したPDFは、Google Driveの `MuseuM VMS PDFs` フォルダに保存されます。添付一覧はスプレッドシートの `Data` シートで管理されます。

この機能を使う前に、ローカルの `google-apps-script/Code.gs` の最新版をApps Scriptへ貼り付け、保存後に `デプロイ` から新しいバージョンを作成してください。既存のWebアプリURLはそのまま利用できます。

初回はApps Scriptの関数選択から `authorizePdfStorage` を選び、`実行` してGoogle Driveの権限を許可してください。
