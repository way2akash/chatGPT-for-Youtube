# youtube summariser

## Installation
>Make sure you have latest **NodeJs** version installed

Clone repo

```
git clone https://github.com/way2akash/youtube-summary-with-chatgpt.git
```
Go to `youtube-summary-with-chatgpt` directory run

```
npm install
```
Now build the extension using
```
npm run build
```
You will see a `build` folder generated inside `youtube-summary-with-chatgpt`


## Adding React app extension to Chrome

In Chrome browser, go to chrome://extensions page and switch on developer mode. This enables the ability to locally install a Chrome extension.


Now click on the `LOAD UNPACKED` and browse to `youtube-summary-with-chatgpt\build` ,This will install the React app as a Chrome extension.

when you open any video on youtube, it will automatically create `YOUTUBE SUMMARY WITH CHATGPT` panel above video suggestions in right side 

