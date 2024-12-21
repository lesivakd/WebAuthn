import { startAuthentication } from '@simplewebauthn/browser';

window.addEventListener("pageshow", () => {
    console.log("pageshow")
    document.getElementById("successPopup").style.display = "none";
    document.getElementById("errorPopup").style.display = "none";
})


document.getElementById("btn-pop-err").onclick = () => {
    document.getElementById("errorPopup").style.display = 'none';
}
document.getElementById("error").onclick = () => {
    document.getElementById("unknown").style.display = 'none';
}

document.getElementById("user_not").onclick = () => {
    document.getElementById("not_user").style.display = 'none';
}

const elemBegin = document.getElementById('5')
const elemSuccess = document.getElementById('successPopup')
const elemError = document.getElementById('errorPopup')
const unknown_error_pop = document.getElementById('unknown')
const user_not = document.getElementById('user_not')
elemBegin.addEventListener('click', async () => {
    console.log('start reg')


    const username = document.getElementById("usernameinput").value
    const resp = await fetch(`/generate-authentication-options/?name=${username}`);
    if (resp.status === 409) {
        console.log("status")
        document.getElementById('not_user').style.display = 'block'
        return
    }
    const optionsJSON = await resp.json();

    let asseResp;
    try {
        asseResp = await startAuthentication({optionsJSON});
    } catch (error) {
        unknown_error_pop.style.display = 'block'
    }


    const verificationResp = await fetch(`/verify-authentication/?name=${username}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(asseResp),
    });

    if (verificationResp.status === 200) {
        console.log("auth successful")
        document.getElementById('successPopup').style.display = 'block';
        localStorage.setItem("username", username)
    } else {
        console.log("auth failed")
        document.getElementById('errorPopup').style.display = 'block'

    }
});