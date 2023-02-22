const header = document.querySelector(".header");
if (window.innerWidth > 768) {
  window.addEventListener("scroll", (e) => {
    if (window.scrollY > 100) {
      header.classList.add("active");
    } else {
      if (header.classList.contains("active")) {
        header.classList.remove("active");
      }
    }
  });
} else {
  window.addEventListener("scroll", (e) => {
    if (window.scrollY > 50) {
      header.classList.add("active");
    } else {
      if (header.classList.contains("active")) {
        header.classList.remove("active");
      }
    }
  });
}
