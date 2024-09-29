# es6 기능 활용


1. my-proxy
  <ol>
    <li>javascript Proxy를 사용해 input을 관리하는 기능입니다.</li>
    <li>value를 set, get 할 때 proxy handler가 동작합니다.</li>
    <li>set: 자바스크립트로 value를 변경해도 input 이벤트를 발생시킵니다. checkbox, radio 타입도 value로 checked 상태를 지정할 수 있습니다.</li>
    <li>get: checkbox, raio 타입도 checked된 value들을 얻을 수 있습니다.</li>
    <li>input 이벤트가 발생하면 proxy에 이벤트가 전달되어 그룹 input들의 상태를 변경할 수 있습니다.</li>
  </ol>
  
2. module-loader
  <ol>
    <li>동적 import를 사용하여 module을 불러오고 window 객체에 bind합니다.</li>
    <li>덮어쓰기(overwrite)를 할 수 있는지 지정할 수 있고 경고 메시지를 출력합니다.</li>
    <li>모듈 불러오기가 완료된 후 사용할 수 있도록 callback 함수 지정을 하거나 event listener로 handler를 지정할 수 있습니다.</li>
  </ol>

3.asnyc
  <ol>
    <li>Promise를 반환하는 모듈을 사용해 화면에서 사용할 데이터를 모듈화 합니다.</li>
    <li>화면에서 여러 번 반복적으로 사용하지만 jsp에 포함하기 어려운 데이터(예: select의 option 값들)에 적용해볼 수 있습니다.</li>
    <li>한 번 fulfilled 된 promise는 다시 서버에 데이터를 요청하지 않으므로 중복된 서버 호출을 줄일 수 있습니다.</li>
    
  </ol>
