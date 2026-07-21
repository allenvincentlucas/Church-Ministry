// Tech & Worship Academy — shared site behavior
// Progress is stored per-topic in localStorage, scoped to this browser/device.

(function(){
  const topicId = document.body.dataset.topic;
  if(!topicId) return;

  const storeKey = `twa-progress:${topicId}`;

  function getDone(){
    try{ return JSON.parse(localStorage.getItem(storeKey) || "[]"); }
    catch(e){ return []; }
  }
  function setDone(arr){
    try{ localStorage.setItem(storeKey, JSON.stringify(arr)); }catch(e){}
  }

  function refreshUI(){
    const done = getDone();
    document.querySelectorAll("[data-lesson]").forEach(section => {
      const id = section.dataset.lesson;
      const isDone = done.includes(id);
      const btn = section.querySelector(".mark-complete");
      if(btn){
        btn.classList.toggle("is-done", isDone);
        btn.textContent = isDone ? "✓ Completed" : "Mark this lesson complete";
      }
      const railLink = document.querySelector(`.rail-link[data-lesson-link="${id}"]`);
      if(railLink) railLink.classList.toggle("done", isDone);
    });
    const total = document.querySelectorAll("[data-lesson]").length;
    const label = document.querySelector(".rail-progress-label");
    if(label) label.textContent = `${done.length} of ${total} lessons complete`;
  }

  document.querySelectorAll(".mark-complete").forEach(btn => {
    btn.addEventListener("click", () => {
      const section = btn.closest("[data-lesson]");
      const id = section.dataset.lesson;
      let done = getDone();
      if(done.includes(id)) done = done.filter(x => x !== id);
      else done.push(id);
      setDone(done);
      refreshUI();
    });
  });

  const resetBtn = document.querySelector(".reset-link");
  if(resetBtn){
    resetBtn.addEventListener("click", () => {
      if(confirm("Reset your progress on this topic?")){
        setDone([]);
        refreshUI();
      }
    });
  }

  refreshUI();
})();

// Video facades: load the iframe only after the user clicks play.
document.querySelectorAll(".video-frame[data-video-id]").forEach(frame => {
  frame.addEventListener("click", function handler(){
    const id = frame.dataset.videoId;
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
    iframe.title = "Video";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    frame.innerHTML = "";
    frame.appendChild(iframe);
    frame.removeEventListener("click", handler);
  }, { once:false });
});

// Quiz reveals
document.querySelectorAll(".quiz").forEach(quiz => {
  const opts = quiz.querySelectorAll(".quiz-opt");
  const explain = quiz.querySelector(".quiz-explain");
  opts.forEach(opt => {
    opt.addEventListener("click", () => {
      opts.forEach(o => o.classList.remove("correct","wrong"));
      if(opt.dataset.correct === "true"){
        opt.classList.add("correct");
      }else{
        opt.classList.add("wrong");
        const correctOpt = [...opts].find(o => o.dataset.correct === "true");
        if(correctOpt) correctOpt.classList.add("correct");
      }
      if(explain) explain.classList.add("show");
    });
  });
});
