import { BG, FG } from "./colors.js";

enum ScreenGlobalState {
	WRITING = 0,
	EXITING = 1,
	HELP = 2,
	SAVING = 3,
}

class ScreenState {
	mode: ScreenGlobalState = ScreenGlobalState.WRITING;

	fileName = "";
	content = [
		"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut",
		"labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores ",
		"et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. ",
		"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et",
		" dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum.",
		" Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.",
	];
	status = "";
	statusStyle: "full" | "middle" = "middle";

	updateStatus() {
		this.status = `[ ${this.fileName.length == 0 ? "New Buffer" : this.fileName} | ${
			this.content.length
		} lines ]`;
	}
}

class ScreenStyle {
	font = "14px monospace";
	lineHeight = 18;

	padding = 4;
}

export class CanvasScreen {
	name: string;
	context: CanvasRenderingContext2D;

	state: ScreenState = new ScreenState();

	style: ScreenStyle = new ScreenStyle();

	constructor(name: string, context: CanvasRenderingContext2D) {
		this.name = name;
		this.context = context;
	}

	// Draw to the screen
	render() {
		// Clear the screen
		this.context.fillStyle = BG;
		this.context.fillRect(0, 0, this.context.canvas.width, this.context.canvas.height);
		this.context.font = this.style.font;

		// Update state
		this.state.updateStatus();

		// Draw top bar
		this._render_top_bar();

		// Draw text
		this._render_buffer();

		// Render menu at bottom
		this._render_bottom_menu();
	}

	_render_buffer() {
		this.context.fillStyle = FG;

		for (let i = 0; i < this.state.content.length; i++) {
			this.context.fillText(
				this.state.content[i],
				this.style.padding,
				this.style.padding + 36 + i * this.style.lineHeight
			);
		}
	}

	_render_top_bar() {
		// Bar
		this.context.fillStyle = FG;
		this.context.fillRect(
			this.style.padding,
			this.style.padding,
			this.context.canvas.width - this.style.padding * 2,
			20
		);

		// Filename
		this.context.fillStyle = BG;
		this.context.fillText(this.name, (this.context.canvas.width - this.name.length * 14) / 2, 20);
	}

	_render_bottom_menu() {
		let options = [];

		switch (this.state.mode) {
			case ScreenGlobalState.WRITING:
				options = ["^G Help", "^X Exit", "^R Reload"];
				break;
			case ScreenGlobalState.EXITING:
				options = [" Y Yes", " N No", "^C Cancel"];
				break;
			case ScreenGlobalState.HELP:
				options = ["^X Exit"];
				break;
			case ScreenGlobalState.SAVING:
				options = [" ↵ Save", "^C Cancel"];
				break;
		}

		// Bottom options
		for (let i = 0; i < options.length; i++) {
			const leftPos = Math.floor(i / 2);
			const topPos = i % 2;

			// Draw background box
			this.context.fillStyle = FG;
			this.context.fillRect(
				this.style.padding + leftPos * 240,
				this.context.canvas.height - this.style.padding - 18 - topPos * 18,
				18,
				18
			);

			// Draw Shortcut text
			this.context.fillStyle = BG;
			this.context.fillText(
				options[i].slice(0, 2),
				this.style.padding + leftPos * 240,
				this.context.canvas.height - this.style.padding - topPos * 18 - 3
			);

			// Draw option text
			this.context.fillStyle = FG;
			this.context.fillText(
				options[i].slice(2),
				this.style.padding + leftPos * 240 + 16,
				this.context.canvas.height - this.style.padding - topPos * 18 - 3
			);
		}

		// Draw status bar
		this.context.fillStyle = FG;
		switch (this.state.mode) {
			case ScreenGlobalState.WRITING:
			case ScreenGlobalState.EXITING:
			case ScreenGlobalState.HELP:
				this.context.fillStyle = FG;
				switch (this.state.statusStyle) {
					case "full":
						this.context.fillRect(
							this.style.padding,
							this.context.canvas.height - this.style.padding - 18 - 18 * 2,
							this.context.canvas.width - this.style.padding * 2,
							18
						);
						this.context.fillStyle = BG;
						this.context.fillText(
							this.state.status,
							this.style.padding,
							this.context.canvas.height - this.style.padding - 18 - 22
						);
						break;
					case "middle":
						const textWidth = this.context.measureText(this.state.status).width;
						this.context.fillRect(
							(this.context.canvas.width - textWidth) / 2 - 6,
							this.context.canvas.height - this.style.padding - 18 - 18 * 2,
							textWidth + 12,
							18
						);
						this.context.fillStyle = BG;
						this.context.fillText(
							this.state.status,
							(this.context.canvas.width - textWidth) / 2,
							this.context.canvas.height - this.style.padding - 18 - 22
						);
				}
				break;
			case ScreenGlobalState.SAVING:
				throw new Error("Not implemented");
		}
	}

	// Handle keyboard input
	key(text: KeyboardEvent) {
		console.log(text);
	}
}
