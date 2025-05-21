export const initAnimateOnScroll = () => {
  const animatedElements = document.querySelectorAll('.animate-fade-in');
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1 }
  );
  
  animatedElements.forEach((el) => observer.observe(el));
  
  return () => {
    animatedElements.forEach((el) => observer.unobserve(el));
  };
};