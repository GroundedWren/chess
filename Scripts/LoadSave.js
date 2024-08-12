/**
 * @file Code for loading and saving games
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
window.GW.Chessboard = window.GW.Chessboard || {};
(function LoadSave(ns) {
	ns.onLoad = async (event) => {
		event.preventDefault();

		switch(event.target.elements["loadMode"].value) {
			case "local":
				GW.Chessboard.Data = JSON.parse(localStorage.getItem(
					`game-${document.getElementById("selLoadLocal").value}`
				));
				break;
			case "upload":
				const loadedData = await GW.Gizmos.FileLib.promptFileAsJSON();
				if(!loadedData || !loadedData.Timestamp || !loadedData.Moves){
					return;
				}
				GW.Chessboard.Data = loadedData;
				GW.Chessboard.Data.Name = GW.Gizmos.FileLib.LastLoadedFilename;
				break;
		}

		updateFileInfo();
		Gw.Chessboard.Snapshots.buildGameSnapshots();
		GW.Chessboard.Rendering.setSnapshot(0);
	};
	ns.onSave = (event) => {
		event.preventDefault();

		switch(event.target.elements["saveMode"].value) {
			case "new":
				const txtSaveName = document.getElementById("txtSaveName");
				saveToLocal(txtSaveName.value);
				txtSaveName.value = "";
				event.target.elements["saveMode"].value = "existing";
				ns.onSaveModeChange(undefined, event.target);
				break;
			case "existing":
				saveToLocal(document.getElementById("selSaveExisting").value);
				break;
			case "download":
				saveToFile();
				break;
		}
	};

	ns.newGame = (event) => {
		event?.preventDefault();
		
		GW.Chessboard.Data = {
			Name: "",
			Timestamp: null,
			Moves: [],
		};
		updateFileInfo();
		GW.Chessboard.Snapshots.buildGameSnapshots();
		GW.Chessboard.Rendering.setSnapshot(0);
	};

	function saveToLocal(gameName) {
		beforeSave(gameName);
		if(!GW.Chessboard.SavesList.includes(gameName)) {
			GW.Chessboard.SavesList.unshift(gameName);
			localStorage.setItem("saves-list", JSON.stringify(GW.Chessboard.SavesList));
			ns.reloadSavesList();
		}
		localStorage.setItem(`game-${gameName}`, JSON.stringify(GW.Chessboard.Data));
		updateFileInfo();
	}

	async function saveToFile() {
		const suggestedName = GW.Chessboard.Data.Name || "New Game";
		beforeSave();
		GW.Chessboard.Data.Name = await GW.Gizmos.FileLib.saveToFile(
			JSON.stringify(GW.Chessboard.Data),
			"application/json",
			"json",
			suggestedName
		);
		updateFileInfo();
	}

	function beforeSave(gameName) {
		if(gameName) {
			GW.Chessboard.Data.Name = gameName;
		}
		else {
			delete GW.Chessboard.Data.Name;
		}
		GW.Chessboard.Data.Timestamp = new Date().toISOString();
	}
	function updateFileInfo() {
		const timSave = document.getElementById("timSave");
		timSave.setAttribute("datetime", GW.Chessboard.Data.Timestamp || "")
		timSave.innerText = GW.Chessboard.Data.Timestamp
			? new Date(GW.Chessboard.Data.Timestamp).toLocaleString(
				undefined,
				{ dateStyle: "short", timeStyle: "medium" }
			)
			: "-";

		document.getElementById("spnName").innerHTML = GW.Chessboard.Data.Name
			? `File: ${GW.Chessboard.Data.Name}`
			: "";
	}

	ns.reloadSavesList = function processLocalSaves() {
		const savesSerialized = localStorage.getItem("saves-list");
		GW.Chessboard.SavesList = savesSerialized ? JSON.parse(savesSerialized) : [];

		if(GW.Chessboard.SavesList.length) {
			const loadOptions = GW.Chessboard.SavesList.map(saveKey => 
				`<option value="${saveKey}">${saveKey}</option>`
			).join("");

			document.getElementById("selLoadLocal").innerHTML = loadOptions;
			document.getElementById("selSaveExisting").innerHTML = loadOptions;
		}
		else {
			document.getElementById("selLoadLocal").innerHTML = `<option value="">No saves</option>`;
			document.getElementById("selSaveExisting").innerHTML = `<option value="">No saves</option>`;
		}
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
	ns.onSaveModeChange = (event, formEl) => {
		const txtSaveName = document.getElementById("txtSaveName");
		const selSaveExisting = document.getElementById("selSaveExisting");

		switch((event ? event.target : formEl).getAttribute("aria-controls")) {
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

	ns.onTxtSaveNameInput = (_event) => {
		const txtSaveName = document.getElementById("txtSaveName");
		const nameVal = txtSaveName.value;
		if(nameVal && GW.Chessboard.SavesList.includes(nameVal)) {
			txtSaveName.setCustomValidity("Save exists");
		}
		else {
			txtSaveName.setCustomValidity("");
		}
	};
}) (window.GW.Chessboard.LoadSave = window.GW.Chessboard.LoadSave || {});