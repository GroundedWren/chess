/**
 * @file Code for loading and saving games
 * @author Vera Konigin vera@groundedwren.com
 */
 
window.GW = window.GW || {};
window.GW.Chessboard = window.GW.Chessboard || {};
(function LoadSave(ns) {
	/**
	 * Loads the initial game
	 */
	ns.configureInitialGame = () => {
		reloadSavesList();

		const lastSaveName = localStorage.getItem("last-save-name");
		const lastSaveDataStr = localStorage.getItem(`game-${lastSaveName}`);
		if(lastSaveDataStr) {
			GW.Chessboard.Data = JSON.parse(lastSaveDataStr);
			document.getElementById("selSaveExisting").value = lastSaveName;
			document.getElementById("formSave").elements["saveMode"].value = "existing";
			ns.onSaveModeChange(undefined, document.getElementById("radSaveModeExisting"));

			updateFileInfo();
			GW.Chessboard.Snapshots.buildGameSnapshots();
			GW.Chessboard.Rendering.setSnapshot(GW.Chessboard.Snapshots.List.length - 1);
		}
		else {
			ns.newGame();
		}
	};
	
	/**
	 * Handler for form submits to load a game
	 * @param {SubmitEvent} event 
	 */
	ns.onLoad = async (event) => {
		event.preventDefault();

		switch(event.target.elements["loadMode"].value) {
			case "local":
				const gameName = document.getElementById("selLoadLocal").value;
				GW.Chessboard.Data = JSON.parse(localStorage.getItem(
					`game-${gameName}`
				));

				localStorage.setItem("last-save-name", gameName);
				document.getElementById("formSave").elements["saveMode"].value = "existing";
				ns.onSaveModeChange(undefined, event.target);
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
		GW.Chessboard.Snapshots.buildGameSnapshots();
		GW.Chessboard.Rendering.setSnapshot(GW.Chessboard.Snapshots.List.length - 1);
	};

	/**
	 * Handler for form submits to save a game
	 * @param {SubmitEvent} event 
	 */
	ns.onSave = (event) => {
		event.preventDefault();

		let saveName;
		switch(event.target.elements["saveMode"].value) {
			case "new":
				const txtSaveName = document.getElementById("txtSaveName");
				saveName = txtSaveName.value;
				ns.saveToLocal(saveName);

				txtSaveName.value = "";
				event.target.elements["saveMode"].value = "existing";
				ns.onSaveModeChange(undefined, event.target);
				document.getElementById("selSaveExisting").value = saveName;
				break;
			case "existing":
				saveName = document.getElementById("selSaveExisting").value;
				ns.saveToLocal(saveName);
				break;
			case "download":
				saveToFile();
				break;
		}
		if(saveName) {
			localStorage.setItem("last-save-name", saveName)
		}
	};
	
	/**
	 * Handler for form submits to begin a new game
	 * @param {SubmitEvent} event 
	 */
	ns.newGame = (event) => {
		event?.preventDefault();

		localStorage.removeItem("last-save-name");
		
		GW.Chessboard.Data = {
			Name: "",
			Timestamp: null,
			Moves: [],
		};
		updateFileInfo();
		GW.Chessboard.Snapshots.buildGameSnapshots();
		GW.Chessboard.Rendering.setSnapshot(0);
	};

	/**
	 * Saves the game data to local storage
	 * @param {string} gameName Name to associate with the save
	 */
	ns.saveToLocal = function saveToLocal(gameName) {
		beforeSave(gameName);
		if(!GW.Chessboard.SavesList.includes(gameName)) {
			GW.Chessboard.SavesList.unshift(gameName);
			localStorage.setItem("saves-list", JSON.stringify(GW.Chessboard.SavesList));
			reloadSavesList();
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

	function reloadSavesList() {
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

	/**
	 * Handler for when the load mode changes
	 * @param {Event} event Change event
	 */
	ns.onLoadModeChange = (event) => {
		const selLoadLocal = document.getElementById("selLoadLocal");

		if(event.target.getAttribute("aria-controls") === "divLoadLocal") {
			selLoadLocal.setAttribute("required", "true");
		}
		else {
			selLoadLocal.removeAttribute("required");
		}
	};

	/**
	 * Handler for when the save mode changes
	 * @param {Event | undefined} event Change event
	 * @param {HTMLElement | undefined} formEl form element controlling the current selection
	 */
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

	/**
	 * Handler for when the save name is changed
	 * @param {InputEvent} _event 
	 */
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