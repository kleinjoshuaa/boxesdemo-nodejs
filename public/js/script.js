function postImpression(data) {
    fetch("/track", {
      method: "POST", // or 'PUT'
      headers: {
        "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      body: `user=${data.user}&eventName=${data.eventName}&value=${data.value}&treatment=${data.treatment}`,
    }).then( (data) => {
      console.log('Impression tracked!')
    })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
  
  function createPopup(parms) {
      let message = parms.message;
      let eventName = parms.eventName;
      let treatment = parms.treatment;
      let value = parms.value;
  
      if (message != null) {
        alert(message + " " + value);
      }
      if (value != null && eventName != "") {
        result = postImpression(parms);
        }
           
    };
  
    const source = new EventSource('/boxStream');

      source.addEventListener('message', message => {
        console.log('Got Message');
        // Display the event data in the `content` div
        document.querySelector('#myTable').innerHTML = message.data;
      });

