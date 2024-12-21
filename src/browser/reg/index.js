import {startRegistration} from '@simplewebauthn/browser';


document.getElementById("btn-pop-suc").onclick = () => {
    document.getElementById("successPopup").style.display = 'none';
}

document.getElementById("btn-pop-err").onclick = () => {
    document.getElementById("errorPopup").style.display = 'none';
}

document.getElementById("user_exist").onclick = () => {
    document.getElementById("exist").style.display = 'none';
}

document.getElementById("error").onclick = () => {
    document.getElementById("unknown").style.display = 'none';
}

const elemBegin = document.getElementById('5')
const elemSuccess = document.getElementById('successPopup')
const elemError = document.getElementById('errorPopup')
const unknown_error_pop = document.getElementById('unknown')
const user_exist = document.getElementById('exist')


elemBegin.addEventListener('click', async () => {
    console.log("starting registration")

    const username = document.getElementById("usernameinput").value

    const resp = await fetch(`/generate-registration-options/?name=${username}`);

    if (resp.status === 409){
        console.log("user already exist")
        document.getElementById('exist').style.display = 'block'
        return
    }
    const optionsJSON = await resp.json();
    console.log(optionsJSON)
    let attResp;
    try {
        attResp = await startRegistration({optionsJSON});
        console.log(attResp)
    } catch (error) {
    console.log(error)
        unknown_error_pop.style.display = 'block'
    }


    const verificationResp = await fetch(`/verify-registration/?name=${username}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(attResp),
    });

    if (verificationResp.status === 200) {
        console.log("reg successful")
        document.getElementById('successPopup').style.display = 'block';
    } else {
        console.log("reg failed")
        document.getElementById('errorPopup').style.display = 'block'
    }
});


