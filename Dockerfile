# Node.jsベースイメージを使用
FROM node:20

# 作業ディレクトリを設定
WORKDIR /app

# パッケージ.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# ソースコードをコピー
COPY . .

# フロントエンドをビルド
RUN npm run build

# ポート3000を公開
EXPOSE 3000

# サーバーを起動
CMD ["node", "server.js"]