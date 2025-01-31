abstract class TagsAdapter {
	/**
	 * Get enabled and disabled tags for a given day or month
	 */
	abstract getTags(time?: number, range?: "day" | "month"): Promise<Tag[]>;

	/**
	 * Create a new tag
	 */
	abstract createTag(tag: string, color: string): Promise<Tag>;

	/**
	 * Delete a tag, does propagate back
	 */
	abstract deleteTag(tag: string): Promise<boolean>;

	/**
	 * Apply tag to day
	 */
	abstract applyTag(tag: string, time?: number): Promise<boolean>;

	/**
	 * Remove tag from day
	 */
	abstract removeTag(tag: string, time?: number): Promise<void>;

	tagDateString(time: number): string {
		const date = new Date(time);
		const dayString = `${date.getFullYear()}-${date.getMonth()}-${date.getDay()}`;

		return dayString;
	}
}

class RemoteTagsAdapter extends TagsAdapter {
	constructor(public baseUrl: string = "") {
		super();
	}

	async getTags(time: number = Date.now(), range: "day" | "month" = "day"): Promise<Tag[]> {
		const res = await fetch(`${this.baseUrl}/tags?type=${range}&date=${this.tagDateString(time)}`);
		const data = await res.json();
		return data;
	}

	async createTag(tag: string, color: string): Promise<Tag> {
		const res = await fetch(`${this.baseUrl}/tags`, {
			method: "POST",
			headers: {
				"Content-type": "application/json",
			},
			body: JSON.stringify({ tag, color }),
		});
		const newTag = await res.json();

		return newTag;
	}

	async deleteTag(tag: string): Promise<boolean> {
		const res = await fetch(`${this.baseUrl}/tags`, {
			method: "DELETE",
			header: {
				"Content-type": "application/json",
			},
			body: JSON.stringify({
				tag,
			}),
		});

		return res.ok;
	}

	async applyTag(tag: string, time: number = Date.now()): Promise<boolean> {
		const res = await fetch(`${this.baseUrl}/tags/${encodeURIComponent(tag)}`, {
			method: "POST",
			header: {
				"Content-type": "application/json",
			},
			body: JSON.stringify({
				day: this.tagDateString(time),
			}),
		});

		return res.ok;
	}

	async removeTag(tag: string, time: number = Date.now()): Promise<void> {
		const res = await fetch(`${this.baseUrl}/tags/${encodeURIComponent(tag)}`, {
			method: "DELETE",
			headers: {
				"Content-type": "application/json",
			},
			body: JSON.stringify({ day: this.tagDateString(time) }),
		});
	}
}

class LocalTagsAdapter extends TagsAdapter {
	ensureTagsItem() {
		if (localStorage.getItem("tags") === null) {
			localStorage.setItem("tags", JSON.stringify([]));
			return false;
		}

		return true;
	}

    ensureDaysItem() {

    }

    async getMonthTags()

	async getTags(time: number, range: "day" | "month"): Promise<Tag[]> {
        if (range === "month") {
            const date = new Date(time)
            const daysInMonth = date.getDate();
            const totalDays = new Date(date.getFullYear(), date.getMonth(), 0).getDate();

            const oneDay =  1000 * 60 * 60 * 24
            const startTime = time - daysInMonth * oneDay;

            for (let i = 0; i < totalDays; i++) {

            }
        }

		if (!this.ensureTagsItem()) {
			return [];
		}

		const availableTags =  JSON.parse(localStorage.getItem("tags")!);
        const tagsOfToday = 
	}

	async createTag(tag: string, color: string): Promise<Tag> {
		const newTag = { tag, color, enabled: false };

		localStorage.setItem("tags", JSON.stringify((await this.getTags()).push(newTag)));

		return newTag;
	}

	async deleteTag(tag: string): Promise<boolean> {
		const tags = await this.getTags();

		let included = false;

		localStorage.setItem(
			"tags",
			JSON.stringify(
				tags.filter((entry) => {
					if (entry.tag === tag) {
						included = true;
						return false;
					}

					return true;
				})
			)
		);

		return included;
	}

	async applyTag(tag: string, time: number = Date.now()): Promise<boolean> {
        
    }
}

interface Tag {
	tag: string;
	color: string;
	enabled: boolean;
}
