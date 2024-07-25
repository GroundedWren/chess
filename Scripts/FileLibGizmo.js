/**
 * @file A library to simplify loading and saving files
 * @author Vera Konigin vera@groundedwren.com
 * https://groundedwren.neocities.org
 */

window.GW = window.GW || {};
window.GW.Gizmos = window.GW.Gizmos || {};
(function FileLib(ns) {
	/**
	 * Saves information to a file as specified, using the showSaveFilePicker API if available
	 * @param {string} text The contents of the file as a string
	 * @param {string} fileType The file's MIME type (e.g. text/plain, application/json)
	 * @param {string} extension The file's extension (e.g. txt, json)
	 * @param {string} suggestedName The name of the saved file (optional)
	 * @returns {Promise<void>} A promise which resolves once the file is saved
	 */
	ns.saveToFile = async (text, fileType, extension, suggestedName) => {
		if(!window.showSaveFilePicker) {
			saveToFileAlt(text, fileType, extension, suggestedName);
			return;
		}

		const fileHandle = await window.showSaveFilePicker({
			types: [{accept: {[fileType]: ["." + extension]}}],
			suggestedName: suggestedName || ""
		});
		const writable = await fileHandle.createWritable();
		writable.write(text);
		await writable.close();
	};
	function saveToFileAlt(text, fileType, extension, suggestedName) {
		let downloadLinkEl = document.getElementById("gwFileDownloadLink");
		if(!downloadLinkEl) {
			document.documentElement.insertAdjacentHTML("afterbegin", `<a id="gwFileDownloadLink" style="display: none" download></a>`);
			downloadLinkEl = document.getElementById("gwFileDownloadLink");
		}

		const file = new File([text], suggestedName, {type: fileType});

		downloadLinkEl.href = window.URL.createObjectURL(file);
		downloadLinkEl.setAttribute("download", (suggestedName || "Download") + "." + extension);
		downloadLinkEl.click();
	}

	/**
	 * Prompts the user for a JSON file using the showOpenFilePicker API if available
	 * @returns {Promise<object>} a POJO of the JSON
	 */
	ns.promptFileAsJSON = async () => {
		const fileText = await ns.promptFileAsText("application/json", ".json");

		let result = "";
		try {
			result = JSON.parse(fileText);
		}
		catch (e) {
			alert("Invalid JSON file");
		}

		return result;
	};
	/**
	 * Prompts the user for a file as specified, using the showOpenFilePicker API if available
	 * @param {string} fileType The file's MIME type (e.g. text/plain, application/json)
	 * @param {string} extension The file's extension (e.g. txt, json)
	 * @returns {Promise<string>} The file's contents as text
	 */
	ns.promptFileAsText = async (fileType, extension) => {
		const file = await promptFile(fileType, extension);

		const reader = new FileReader();
		let readerLoadResolveFn;
		const readerLoadPromise = new Promise(resolve => readerLoadResolveFn = resolve);
		reader.addEventListener('load', (progressEvent) => {
			readerLoadResolveFn(progressEvent.target.result);
		});

		reader.readAsText(file);
		return readerLoadPromise;
	};
	async function promptFile(fileType, extension) {
		if(!window.showOpenFilePicker) {
			return promptFileAlt(extension);
		}

		const handles = await window.showOpenFilePicker({
			multiple: false,
			types: [{accept: {[fileType]: ["." + extension]}}]
		});
		return handles[0].getFile();
	}
	function promptFileAlt(extension) {
		let filePickerEl = document.getElementById("gwFilePickerInput");
		if(!filePickerEl) {
			document.documentElement.insertAdjacentHTML("afterbegin", `<input type="file" id="gwFilePickerInput" style="display: none;">`);
			filePickerEl = document.getElementById("gwFilePickerInput");
		}

		filePickerEl.setAttribute("accept", extension);

		let filePickerResolveFn;
		const filePickerPromise = new Promise(resolve => filePickerResolveFn = resolve);
		filePickerEl.onchange = () => {
			filePickerResolveFn(filePickerEl.files[0]);
		};

		filePickerEl.click();
		return filePickerPromise;
	}
}) (window.GW.Gizmos.FileLib = window.GW.Gizmos.FileLib || {});
