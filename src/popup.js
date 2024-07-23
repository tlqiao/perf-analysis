import config from './config.js'
document.getElementById('screenshot').addEventListener('click', function () {
        const fileName = document.getElementById('fileName').value;
        chrome.tabs.captureVisibleTab(null, { format: 'jpeg', quality: 100 }, function (dataUrl) {
                fetch(dataUrl)
                        .then(res => res.blob())
                        .then(blob => {
                                uploadScreenshot(blob, fileName);
                        });
        });
});

function uploadScreenshot(blob, fileName) {
        const formData = new FormData();
        formData.append('screenshot', blob, fileName);
        let url = config.BACKEND_SERVER_BASE_URL + '/upload'
        fetch(url, {
                method: 'POST',
                body: formData
        })
                .then(response => response.json())
                .then(data => console.log('Upload successful', data))
                .catch(error => console.error('Upload failed', error));
}

document.addEventListener('DOMContentLoaded', async function () {
        const fileDropdown = document.getElementById("fileDropdown");
        let file_list = await getFileList()
        file_list.forEach(file => {
                const container = document.createElement('div');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = file;
                const label = document.createElement('label');
                label.textContent = file
                container.appendChild(checkbox);
                container.appendChild(label)
                fileDropdown.appendChild(container)
        });
});

document.getElementById("toggleAll").onclick = function () {
        let checkboxes = document.getElementById("fileDropdown").getElementsByTagName("input");
        let allChecked = true;
        for (var i = 0; i < checkboxes.length; i++) {
                if (!checkboxes[i].checked) {
                        allChecked = false;
                        break;
                }
        }
        for (var i = 0; i < checkboxes.length; i++) {
                checkboxes[i].checked = !allChecked;
        }
}

document.getElementById("analysis").addEventListener("click", function () {
        let analysis_button = document.getElementById("analysis");
        let spinner = document.getElementById("spinner");
        analysis_button.disabled = true
        spinner.hidden = false
        let url = config.BACKEND_SERVER_BASE_URL + "/analysis"
        fetch(url, {
                method: 'POST',
                headers: {
                        'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                        "filePaths": getCheckedFiles()
                })
        })
                .then(response => response.json())
                .then(data => {
                        let result = JSON.stringify(data.choices[0].message.content, null, 2);
                        document.getElementById('result').value = result;
                })
                .catch(error => {
                        console.error('Error:', error);
                        document.getElementById('result').value = 'Failed to get performance analysis';
                }).finally(() => {
                        spinner.hidden = true;
                        analysis_button.disabled = false;
                });
})

function getCheckedFiles() {
        const checkedLabels = [];
        const fileDropdown = document.getElementById("fileDropdown");
        const checkboxes = fileDropdown.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(checkbox => {
                const label = checkbox.nextElementSibling;
                if (label && label.tagName === 'LABEL') {
                        checkedLabels.push(label.textContent);
                }
        });
        return checkedLabels;
}

async function getFileList() {
        let url = config.BACKEND_SERVER_BASE_URL + '/getFileList';
        try {
                const response = await fetch(url, {
                        method: 'GET',
                });
                if (!response.ok) {
                        throw new Error('Network response was not ok');
                }
                const data = await response.json();
                if (!data || !data.filenames) {
                        throw new Error('Invalid response data: "filenames" property not found');
                }
                console.log('GetFileList successful', data.filenames);
                return data.filenames
        } catch (error) {

                console.error('GetFileList failed', error);
                throw error;
        }
}
