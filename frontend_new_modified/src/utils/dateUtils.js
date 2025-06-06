export const isEventActive = (eventDate) => {
    const today = new Date();
    const eventDateObj = new Date(eventDate);
    today.setHours(0, 0, 0, 0);
    eventDateObj.setHours(0, 0, 0, 0);
    return eventDateObj >= today;
  };
  
  export const formatDate = (date) => {
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };