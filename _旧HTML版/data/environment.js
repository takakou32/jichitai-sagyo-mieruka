// 環境・システム構成図
// x, y は図上の位置（左上が 0,0。1 単位 = 1 マス）
window.DATA = window.DATA || {};
window.DATA.environment = {
  zones: [
    { id: "center", label: "現行環境", x: 0, y: 0, w: 3, h: 4, status: "要確認" },
    { id: "gov",    label: "ガバメントクラウド（OCI）", x: 3.5, y: 0, w: 4.3, h: 4 },
    { id: "check",  label: "確認者側", x: 8, y: 0, w: 2.5, h: 4 }
  ],
  nodes: [
    { id: "v1",     zone: "center", label: "現行システム（V1）", x: 0.5, y: 0.6,
      desc: "移行元。ここから抽出したCSVが移行ツールの入力になる。", status: "要確認" },
    { id: "fs",     zone: "center", label: "ファイルサーバ", x: 0.5, y: 2.4,
      desc: "抽出CSV、移行ツール資産、ログの置き場。作業中に何度も行き来する。", status: "要確認" },
    { id: "client", zone: "gov", label: "作業者クライアント\n（Windows）", x: 4, y: 0.6,
      desc: "OCI上のWindowsインスタンス。移行ツールと iko_gui をここで操作する。使える実行環境：PowerShell 5.1、.NET、Java 17。Pythonは不可。" },
    { id: "tool",   zone: "gov", label: "移行ツール\n（bat / pl/sql / SQL*Loader / java）", x: 4, y: 2.4,
      desc: "開発元が提供する移行ツール。iko_gui はこれをワンストップで実行するためのラッパー。" },
    { id: "db",     zone: "gov", label: "移行先DB", x: 6, y: 2.4,
      desc: "標準準拠システムのDB。", status: "要確認" },
    { id: "logs",   zone: "gov", label: "ログ格納先", x: 6, y: 0.6,
      desc: "ログ集約・ログ格納batでアップロードされたログの置き場。確認者はここを見る。", status: "要確認" },
    { id: "checker", zone: "check", label: "確認者端末\n（Windows）", x: 8.5, y: 1.5,
      desc: "作業者とは別の端末。アップロードされたログとDBを確認する。Java 17が動き、DBにも接続できる。" }
  ],
  edges: [
    { from: "v1", to: "fs", label: "抽出CSV" },
    { from: "fs", to: "client", label: "CSV・資産の取得" },
    { from: "client", to: "tool", label: "実行" },
    { from: "tool", to: "db", label: "取込" },
    { from: "tool", to: "logs", label: "ログ格納" },
    { from: "logs", to: "checker", label: "ログ確認" },
    { from: "db", to: "checker", label: "件数・エラー照会" }
  ]
};
