import * as d3 from "d3";

export class Legend {
    public color = d3.scaleSequential([20, 25], d3.interpolateViridis);
    public tickSize = 16;
    public width = 320;
    public height = 44 + this.tickSize;

    public marginTop = 18;
    public marginBottom = 16 + this.tickSize;
    public marginLeft = 0;
    public marginRight = 0;
    public ticks = this.width / 64;
    public tickFormat = undefined;
    public tickValues = undefined;
    public title: string = "Intensity";


    public init() {

        function ramp(
            color: d3.ScaleSequential<string, never>,
            n = 256
        ): HTMLCanvasElement {
            const canvas = document.createElement("canvas");
            canvas.width = n;
            canvas.height = 1;
            const context = canvas.getContext("2d");
            if (!context) {
                return canvas;
            }
            for (let i = 0; i < n; ++i) {
                context.fillStyle = color(i / (n - 1));
                context.fillRect(i, 0, 1, 1);
            }
            return canvas;
        }

        // clear all
        //d3.select("svg").selectAll("*").remove();

        const svg = d3
            .select("svg#legend")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("viewBox", [0, 0, this.width, this.height])
            .style("overflow", "visible")
            .style("display", "block");

        const tickAdjust = (
            g: d3.Selection<SVGGElement, undefined, null, undefined>
        ) =>
            g
                .selectAll(".tick line")
                .attr("y1", this.marginTop + this.marginBottom - this.height);

        const n = Math.min(this.color.domain().length, this.color.range().length);

        const x = this.color
            .copy()
            .rangeRound(
                d3.quantize(d3.interpolate(this.marginLeft, this.width - this.marginRight), n)
            );

        // legend background rectangle
        svg.append("rect")
            .attr("x", -12)
            .attr("y", 0)
            .attr("width", this.width + 24)
            .attr("height", this.height)
            .attr("fill", "#00000088");

        // color bar
        svg.append("image")
            .attr("x", this.marginLeft)
            .attr("y", this.marginTop)
            .attr("width", this.width - this.marginLeft - this.marginRight)
            .attr("height", this.height - this.marginTop - this.marginBottom)
            .attr("preserveAspectRatio", "none")
            .attr(
                "xlink:href",
                ramp(
                    this.color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))
                ).toDataURL()
            );

        // ticks
        svg.append("g")
            .attr("transform", `translate(0,${this.height - this.marginBottom})`)
            .call(
                d3
                    .axisBottom(x as any)
                    //.ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
                    //.tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
                    .tickSize(this.tickSize)
                //.tickValues([1, 2, 3])
            )
            .call(tickAdjust as any)
            .call((g) => g.select(".domain").remove())
            .call((g) =>
                g
                    .append("text")
                    .attr("x", this.marginLeft)
                    .attr("y", this.marginTop + this.marginBottom - this.height - 6)
                    .attr("fill", "currentColor")
                    .attr("text-anchor", "start")
                    .attr("font-weight", "bold")
                    .text(this.title)
            );
    }
}
