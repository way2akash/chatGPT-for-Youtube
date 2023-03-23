
let videoId
var query;  //  query we are sending to chat gpt
flag = false
let ytFetchStatus = false
let accessTokenValidity   //chatgpt access token
let promptMsg



chrome.runtime.onMessage.addListener(async function (response, sender, sendResponse) {
    if (response.update === "updated") {
        let currUrl = window.location.href
        if (currUrl.includes("/watch?v")) {
            mainFn()

        }
    }
})


const mainFn = () => {
    accessTokenValidity = false
    ytFetchStatus = false



    if (document.getElementById("yt_trancript_panel")) {
        document.getElementById("yt_trancript_panel").remove()
    }

    let access = chrome.storage.sync.get("accessToken")
    access.then((e) => {
        if (e.accessToken) {
            accessTokenValidity = true
        }
    })
    waitUntilVideoElementLoads()
}



async function waitUntilVideoElementLoads() {
    return await new Promise((resolve) => {
        const interval = setInterval(() => {
            let element = document.querySelector("#columns #secondary")

            let finalState = true;

            if (!element) finalState = false;

            if (finalState) {
                videoId = window.location.search
                query = ""
                promptMsg = ""

                if (!document.getElementById("yt_trancript_panel")) {
                    const box = document.createElement("div");


                    box.setAttribute("id", "yt_trancript_panel");
                    element.prepend(box)
                    headerDiv(box)
                    ytFetch()

                }

                clearInterval(interval);
            }
        }, 1000);
    });
}


const headerDiv = (box) => {
    const titleDiv = document.createElement('div')
    titleDiv.setAttribute('id', 'yt_transcript_title_div');
    box.appendChild(titleDiv)
    //LOGO Creation
    let logoImgSrc = chrome.runtime.getURL("assests/logo.png")
    let logoImg = new Image()
    logoImg.setAttribute("id", "logoImg")
    logoImg.src = logoImgSrc
    titleDiv.appendChild(logoImg)

    // Title Creation
    let title = document.createElement("p")
    title.innerText = "Youtube Summary with ChatGPT"
    title.setAttribute('id', "titleId")
    titleDiv.appendChild(title)

    //DropDown Creation
    let vectorImgSrc = chrome.runtime.getURL("assests/Vector.png")
    let vectorImg = new Image()
    vectorImg.src = vectorImgSrc
    vectorImg.setAttribute("id", "vectorImg")
    titleDiv.appendChild(vectorImg)

    titleDiv.addEventListener("click", openTranscript)
}


const openTranscript = () => {

    if (ytFetchStatus) {
        let vectorImg = document.getElementById("vectorImg")

        if (flag) {
            vectorImg.style.transform = "rotate(0deg)";
            if (document.getElementById("noTranscriptDiv")) {
                document.getElementById("noTranscriptDiv").style.display = "none"
            } else {
                document.getElementById("containerDiv").style.display = "none"
            }
            flag = false

        } else {
            vectorImg.style.transform = "rotate(-180deg)";
            if (document.getElementById("noTranscriptDiv")) {
                document.getElementById("noTranscriptDiv").style.display = "flex"
            } else {
                document.getElementById("containerDiv").style.display = "flex"
            }
            flag = true

        }

    }


}


const ytFetch = () => {

    fetch(`https://www.youtube.com/watch${videoId}`)
        .then((response) => response.text())
        .then((data) => {

            // captions data
            let objStartPoint = data.indexOf('"captionTracks":')
            let objEndPoint = data.indexOf("]", objStartPoint)
            let output = data.slice(objStartPoint + 16, objEndPoint + 1)

            // video data
            let videoDataStart = data.indexOf('"microformat":{"playerMicroformatRenderer"')
            let videoDataEnd = data.indexOf('"cards":{"cardCollectionRenderer"', videoDataStart)
            let videoData = data.slice(videoDataStart + 14, videoDataEnd - 1)

            let parsedVideoData = JSON.parse(videoData)


            let videoTitle = parsedVideoData.playerMicroformatRenderer.title.simpleText
            let videoDesc = parsedVideoData.playerMicroformatRenderer.description.simpleText


            promptMsg = `summarize the following: video title:${videoTitle}, description :${videoDesc}, transcript: `



            try {
                let parsedOutput = JSON.parse(output)
                let flagg = false;
                for(let i=0; i<parsedOutput.length; i++){
                    if(parsedOutput[i].languageCode === "en"){
                        flagg= true;
                        transcriptFetch(parsedOutput[i].baseUrl)
                        
                        break;
                    }
                    else{
                        continue;
                    }
                }
                if(!flagg){
                    transcriptFetch(parsedOutput[0].baseUrl)

                }

            } catch(err) {
                createNoTranscript()
            }
            ytFetchStatus = true



            return;

        });


}

const transcriptFetch=(url)=>{
    fetch(url)
    .then((response) => response.text())
    .then((data) => {
        if (!document.getElementById("containerDiv")) {
            createContainerDiv()

            const parser = new DOMParser();
            const document = parser.parseFromString(data, 'text/html');
            document.querySelectorAll("transcript")[0].querySelectorAll("text").forEach((item) => {
                createTranscripts(item)
                query = query + item.innerText
            })
        }

    })
}



const createNoTranscript = () => {
    if (!document.getElementById("noTranscriptDiv")) {
        let noTranscriptDiv = document.createElement("div")
        noTranscriptDiv.setAttribute("id", "noTranscriptDiv")
        let box = document.getElementById("yt_trancript_panel")
        box.appendChild(noTranscriptDiv)


        // creating inner div
        let noTranscriptInnerDiv = document.createElement("div")
        noTranscriptInnerDiv.setAttribute("id", "noTranscriptInnerDiv")
        noTranscriptDiv.appendChild(noTranscriptInnerDiv)

        // notranscript error img
        let notranscriptImgSrc = chrome.runtime.getURL("assests/notranscript.png")
        let notranscriptImg = new Image()
        notranscriptImg.setAttribute("id", "notranscriptImg")
        notranscriptImg.src = notranscriptImgSrc
        noTranscriptInnerDiv.appendChild(notranscriptImg)


        // noTranscriptInnerDiv error msg
        let noTranscriptErrMsg = document.createElement("div")
        noTranscriptErrMsg.setAttribute("id", "noTranscriptErrMsg")
        noTranscriptErrMsg.innerText = "No Transcript available for this video"
        noTranscriptInnerDiv.appendChild(noTranscriptErrMsg)

    }

}


const createContainerDiv = () => {
    let box = document.getElementById("yt_trancript_panel")
    let containerDiv = document.createElement("div")
    containerDiv.setAttribute("id", "containerDiv")
    box.appendChild(containerDiv)
    createOptions(containerDiv)
    createTranscriptSection(containerDiv)
    createSummarySection(containerDiv)
}

const createOptions = (containerDiv) => {
    const optiondiv = document.createElement("div")
    optiondiv.setAttribute('id', "optionDiv")
    containerDiv.appendChild(optiondiv)

    // create transcript button
    let transcriptBtnDiv = document.createElement("div")
    transcriptBtnDiv.setAttribute("id", "transcriptBtnDiv")
    transcriptBtnDiv.innerText = "Transcript"
    optiondiv.appendChild(transcriptBtnDiv)
    transcriptBtnDiv.addEventListener("click", transcriptBtnListener)


    //create summary button
    let summaryBtnDiv = document.createElement("div")
    summaryBtnDiv.setAttribute("id", "summaryBtnDiv")
    summaryBtnDiv.innerText = "Summarize"
    optiondiv.appendChild(summaryBtnDiv)
    summaryBtnDiv.addEventListener("click", summaryBtnListener)


}

const createTranscriptSection = (containerDiv) => {
    let transcriptSection = document.createElement("div")
    transcriptSection.setAttribute("id", "transcriptSection")
    containerDiv.appendChild(transcriptSection)

}


const createTranscripts = (item) => {
    let transcriptSection = document.getElementById("transcriptSection")
    let transcriptelm = document.createElement("div")
    transcriptelm.setAttribute("class", "transcriptelm")
    transcriptSection.appendChild(transcriptelm)
    createTranscriptTime(transcriptelm, item)
    createTranscriptText(transcriptelm, item)

}

const createTranscriptTime = (transcriptelm, item) => {
    let transcriptTime = document.createElement("div")
    transcriptTime.setAttribute("id", "transcriptTime")
    let getTime = Math.floor(item.getAttribute("start"))
    let tym = timeFormatting(getTime)
    transcriptTime.innerText = tym
    transcriptelm.appendChild(transcriptTime)

    transcriptTime.addEventListener("click", () => {
        document.querySelector("video").currentTime = getTime
    })


}

const timeFormatting = (time) => {

    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (time > 3575) {
        return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    } else {
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

}

const createTranscriptText = (transcriptelm, item) => {
    let transcriptText = document.createElement("div")
    transcriptText.setAttribute("id", "transcriptText")
    transcriptText.innerText = item.innerText.replaceAll("&#39;", "'")
    transcriptelm.appendChild(transcriptText)

}



const createSummarySection = (containerDiv) => {
    let summarySection = document.createElement("div")
    summarySection.setAttribute("id", "summarySection")
    containerDiv.appendChild(summarySection)
}

const transcriptBtnListener = () => {
    let summaryBtnDiv = document.getElementById("summaryBtnDiv")
    let transcriptBtnDiv = document.getElementById("transcriptBtnDiv")
    let summarySection = document.getElementById("summarySection")
    let transcriptSection = document.getElementById("transcriptSection")
    summarySection.style.display = "none"
    transcriptSection.style.display = "flex"

    transcriptBtnDiv.style.background = "#CC0036"
    transcriptBtnDiv.style.color = "#FFFFFF"
    summaryBtnDiv.style.background = "#FFFFFF"
    summaryBtnDiv.style.color = "#3C453C"
}


const summaryBtnListener = () => {
    let summaryBtnDiv = document.getElementById("summaryBtnDiv")
    let transcriptBtnDiv = document.getElementById("transcriptBtnDiv")
    let summarySection = document.getElementById("summarySection")
    let transcriptSection = document.getElementById("transcriptSection")
    summarySection.style.display = "flex"
    transcriptSection.style.display = "none"

    summaryBtnDiv.style.background = "#CC0036"
    summaryBtnDiv.style.color = "#FFFFFF"
    transcriptBtnDiv.style.background = "#FFFFFF"
    transcriptBtnDiv.style.color = "#3C453C"


    if (accessTokenValidity) {
        if (!document.getElementById("summaryDiv")) {

            if (document.getElementById("loginDiv")) {
                document.getElementById("loginDiv").style.display = "none"
            }

            // creating summary div
            let summaryDiv = document.createElement("div")
            summaryDiv.setAttribute("id", "summaryDiv")
            summarySection.appendChild(summaryDiv)

            // summary loader
            let loaderArr = [
                "assests/loader1.png",
                "assests/loader2.png",
                "assests/loader3.png"
            ]
            let loaderImg = new Image()
            summaryDiv.appendChild(loaderImg)
            loaderImg.setAttribute("id", "loaderImg")

            let loaderInterval = setInterval(() => {
                let loaderSrc = chrome.runtime.getURL(loaderArr[Math.floor(Math.random() * 3)])
                loaderImg.src = loaderSrc
            }, 200);

            let generatingText = document.createElement("p")
            generatingText.setAttribute("id", "generatingText")
            generatingText.innerText = "Generating..."
            summaryDiv.appendChild(generatingText)

            chrome.runtime.sendMessage({ message: 'search-occured', query: `${promptMsg} ${query}` })

            chrome.runtime.onMessage.addListener(function (response, sender, sendResponse) {

                if (response.message === 'answer') {
                    let { answer } = response
                    clearInterval(loaderInterval)
                    loaderImg.remove()
                    generatingText.remove()
                    summaryDiv.style.flexDirection = "none"
                    summaryDiv.style.justifyContent = "flex-start"


                    summaryDiv.innerText = answer

                    // creating footer div
                    if (!document.querySelector("#footerDiv")) {
                        let footerDiv = document.createElement("div")
                        footerDiv.setAttribute("id", "footerDiv")
                        summarySection.appendChild(footerDiv)


                        // creating rate us section
                        let ratingDiv = document.createElement("a")
                        ratingDiv.setAttribute("id", "ratingDiv")
                        footerDiv.appendChild(ratingDiv)
                        ratingDiv.innerText = "Rate us"
                        ratingDiv.href="https://chrome.google.com/webstore/detail/youtube-summary-with-chat/ghdjjmnkpgminongdkinjdcccmncijog"
                        ratingDiv.target="_blank"

                        let starSrc = chrome.runtime.getURL("assests/star.png")
                        let starIcon = new Image()
                        starIcon.setAttribute("id", "starIcon")
                        starIcon.src = starSrc
                        ratingDiv.appendChild(starIcon)

                        // creating copy section
                        let copyDiv = document.createElement("div")
                        copyDiv.setAttribute("id", "copyDiv")
                        footerDiv.appendChild(copyDiv)

                        // let copyIcon= document.createElement()
                        let copyIconSrc = chrome.runtime.getURL("assests/copyIcon.png")
                        let copyIcon = new Image()
                        copyIcon.src = copyIconSrc
                        copyIcon.setAttribute("id", "copyIcon")
                        copyDiv.appendChild(copyIcon)

                        let copyText = document.createElement("p")
                        copyText.setAttribute("id", "copyText")
                        copyText.innerText = "copy summary"
                        copyDiv.appendChild(copyText)

                    }




                    copyDiv.addEventListener("mousedown", () => {
                        navigator.clipboard.writeText(answer);
                        copyText.innerText = "copied !!"

                    })

                    copyDiv.addEventListener("mouseup", () => {
                        copyText.innerText = "copy summary"

                    })

                }

            })
        }
    }
    else {
        if (!document.getElementById("loginDiv")) {
            let loginDiv = document.createElement("div")
            loginDiv.setAttribute("id", "loginDiv")
            summarySection.appendChild(loginDiv)

            // creating inside of login page
            let infoSrc = chrome.runtime.getURL("assests/info.png")
            let info = new Image()
            info.setAttribute("id", "infoDiv")
            info.src = infoSrc
            loginDiv.appendChild(info)

            let warnInfoText = document.createElement("p")
            warnInfoText.setAttribute("id", "warnInfoText")
            loginDiv.appendChild(warnInfoText)
            warnInfoText.innerText = "Cloudflare Security check required"

            let loginTextDiv1 = document.createElement("div")
            loginTextDiv1.setAttribute("id", "loginTextDiv1")
            loginDiv.appendChild(loginTextDiv1)

            let span1 = document.createElement("span")
            span1.innerText = "Please login "
            loginTextDiv1.appendChild(span1)

            let chatGptLink = document.createElement("a")
            chatGptLink.setAttribute("id", "chatGptLink")
            loginTextDiv1.appendChild(chatGptLink)
            chatGptLink.innerText = "chat.openai.com"
            chatGptLink.href = "https://chat.openai.com/chat"
            chatGptLink.target = "_blank"

            let span2 = document.createElement("span")
            span2.innerText = " once and come back"
            loginTextDiv1.appendChild(span2)
        }

    }
}


window.addEventListener('focus', () => {

    if (document.getElementById("summarySection") && document.getElementById("summarySection").style.display === "flex") {


        let access = chrome.storage.sync.get("accessToken")
        access.then((e) => {
            if (e.accessToken) {
                accessTokenValidity = true;

                if (document.getElementById("loginDiv")) {
                    document.getElementById("loginDiv").style.display = "none"
                    summaryBtnListener()

                }

            } else {
                chrome.runtime.sendMessage({ message: 'session-check' })
                chrome.runtime.onMessage.addListener(async function (response, sender, sendResponse) {
                    if (response.message === "session-updated") {
                        let access = chrome.storage.sync.get("accessToken")
                        access.then((e) => {
                            if (e.accessToken) {
                                accessTokenValidity = true;

                                if (document.getElementById("loginDiv")) {
                                    document.getElementById("loginDiv").style.display = "none"
                                    summaryBtnListener()

                                }

                            }
                        })
                    }

                })

            }
        })

    }

});



