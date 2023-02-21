const header = document.querySelector(".header")
window.addEventListener("scroll", (e) =>{

  if(window.scrollY > 100){
    header.classList.add("active")
  }else{
    if(header.classList.contains("active")){
      header.classList.remove("active")
    }
  }
})