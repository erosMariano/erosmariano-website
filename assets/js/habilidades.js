const divToObserve = document.querySelector("#habilidades");
const card = document.querySelectorAll(".habilidades__cards .card");
const descriptions = document.querySelectorAll("#habilidades .description");

if (window.innerWidth > 1046) {
  const observer = new IntersectionObserver((entries, observer) => {
    const [entry] = entries;

    if (entry.isIntersecting) {
      window.addEventListener("scroll", () => {
        if (window.scrollY < entry.target.clientHeight) {
          removeActive();
          card[0].classList.add("active");
          descriptions[0].classList.add("active");
        } else if (window.scrollY < entry.target.clientHeight + 300) {
          removeActive();
          card[1].classList.add("active");
          descriptions[1].classList.add("active");
        } else if (window.scrollY < entry.target.clientHeight + 500) {
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
}

// if (window.innerWidth <= 840) {
//   document
//     .querySelector("#contato .contato__container div > span")
//     .insertAdjacentElement("afterend", document.querySelector(".form"));
// }
