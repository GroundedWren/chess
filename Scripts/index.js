/**
 * @file Chessboard scripts
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
window.GW = window.GW || {};
(function Chessboard(ns) {
	ns.SaveData = {};

	//#region Load & Save
	ns.onLoad = (event) => {
		switch(event.target.elements["loadMode"].value) {
			case "local":
				alert("loadLocal");
				break;
			case "upload":
				alert("loadUpload");
				break;
		}

		event.target.hidePopover();
		event.preventDefault();
	};
	ns.onSave = (event) => {
		switch(event.target.elements["saveMode"].value) {
			case "new":
				alert("saveNew");
				break;
			case "existing":
				alert("saveExisting");
				break;
			case "download":
				alert("saveDownload");
				break;
		}

		event.target.hidePopover();
		event.preventDefault();
	};

	ns.onLoadModeChange = (event) => {
		const selLoadLocal = document.getElementById("selLoadLocal");

		if(event.target.getAttribute("aria-controls") === "divLoadLocal") {
			selLoadLocal.setAttribute("required", "true");
		}
		else {
			selLoadLocal.removeAttribute("required");
		}
	};
	ns.onSaveModeChange = (event) => {
		const txtSaveName = document.getElementById("txtSaveName");
		const selSaveExisting = document.getElementById("selSaveExisting");

		switch(event.target.getAttribute("aria-controls")) {
			case "divNewSave":
				txtSaveName.setAttribute("required", "true");
				selSaveExisting.removeAttribute("required");
				break;
			case "divExistingSave":
				selSaveExisting.setAttribute("required", "true");
				txtSaveName.removeAttribute("required");
				break;
			default:
				txtSaveName.removeAttribute("required");
				selSaveExisting.removeAttribute("required");
				break;
		}
	};

	ns.onTxtSaveNameInput = (event) => {
		const txtSaveName = document.getElementById("txtSaveName");
		const nameVal = txtSaveName.value;
		if(nameVal && ns.SaveData[nameVal]) {
			txtSaveName.setCustomValidity("Save exists");
		}
		else {
			txtSaveName.setCustomValidity("");
		}
	};

	ns.processLocalSaves = function processLocalSaves() {
		if(Object.keys(ns.SaveData).length) {
			const loadOptions = Object.keys(ns.SaveData).map(saveKey => 
				`<option value="${saveKey}">${saveKey}</option>`
			).join("");

			document.getElementById("selLoadLocal").innerHTML = loadOptions;
			document.getElementById("selSaveExisting").innerHTML = loadOptions;
		}
	};
	//#endregion
}) (window.GW.Chessboard = window.GW.Chessboard || {});

window.addEventListener("load", () => {
	GW.Chessboard.SaveData = localStorage.getItem("chess-saves") || {};
	GW.Chessboard.processLocalSaves();
});
window.addEventListener("beforeunload", (event) => {});