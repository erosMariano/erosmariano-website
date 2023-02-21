document.querySelectorAll("option", () => {});

const allOptions = document.querySelectorAll(".option");

allOptions.forEach((el) => {
  el.addEventListener("click", () => {
    allOptions.forEach((el) => {
      el.classList.remove("active");
    });
    el.classList.add("active");
  });
});


