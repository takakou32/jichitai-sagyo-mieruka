// 依頼文などをクリップボードにコピーする
document.querySelectorAll(".copy").forEach(function (b) {
  b.onclick = function () {
    var text = b.parentNode.querySelector("code").textContent;
    var done = function () { b.textContent = "コピーした"; setTimeout(function () { b.textContent = "コピー"; }, 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done);
    else { var t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); document.execCommand("copy"); document.body.removeChild(t); done(); }
  };
});
