const divToObserve = document.querySelector("#habilidades");
const card = document.querySelectorAll(".habilidades__cards .card");
const descriptions = document.querySelectorAll("#habilidades .description");

const observer = new IntersectionObserver((entries, observer) => {
  const [entry] = entries;

  if (entry.isIntersecting) {
    window.addEventListener("scroll", () => {
      if (window.scrollY < entry.target.clientHeight + 400) {
        removeActive();
        card[0].classList.add("active");
        descriptions[0].classList.add("active");
      } else if (window.scrollY < entry.target.clientHeight + 700) {
        removeActive();
        card[1].classList.add("active");
        descriptions[1].classList.add("active");
      } else if (window.scrollY < entry.target.clientHeight + 1000) {
        removeActive();
        card[2].classList.add("active");
        descriptions[2].classList.add("active");
      }
    });
  }
});

function removeActive() {
  card.forEach((el) => {
    if (el.classList.contains("active")) {
      el.classList.remove("active");
    }
  });

  descriptions.forEach((el) => {
    if (el.classList.contains("active")) {
      el.classList.remove("active");
    }
  });
}
observer.observe(divToObserve);
