class Ball {
    GRAVITY = 0.07;

    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 5;
        this.height = 5;
        this.y_speed = 0;
        this.x_speed = 0;
        this.debug_points = [];
    }

    draw(ctx) {
        ctx.fillStyle = 'red';
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        if (DEBUG) {
            this.debug_points.forEach(([x, y, color]) => {
                this.draw_debug_point(x, y, color)
            });
        }
        this.debug_points = [];
    }

    move(line) {
        this.y_speed += this.GRAVITY
        this.y += this.y_speed
        this.x += this.x_speed

        // line collision logic
        for (let i = 0; i < line.points.length - 1; i++) {
            const [x, y] = line.points[i];
            const [nx, ny] = line.points[i + 1];


            if (this.x > x && this.x < nx) {
                // explanation of the collision logic in collision.png
                const m = (ny - y) / (nx - x)
                const slope_angle = Math.atan(m)
                const dx = this.x - x
                const dy = m * dx
                const y_offset = y + dy
                const y_ball_dist = y_offset - this.y
                const ball_offset = y_ball_dist * Math.cos(slope_angle)

                const normal_x = ball_offset * Math.sin(slope_angle)
                const normal_y = -ball_offset * Math.cos(slope_angle)

                const normal = new Vector(
                    normal_x,
                    normal_y
                )
                const velocity = new Vector(
                    this.x_speed,
                    this.y_speed
                )

                this.add_debug_point(this.x - normal.x * 10, this.y - normal.y * 10)
                this.add_debug_point(this.x + this.x_speed * 10, this.y + this.y_speed * 10, 'green')

                // Reflect the ball if it hits the line
                // this was basically just prompted by CoPilot...
                if (ball_offset < this.width) {
                    this.y = y_offset - this.width
                    const normal_vector_unit = normal.unit()
                    const normal_vector_unit_dot_product = normal_vector_unit.dot_product(velocity)
                    const normal_vector_unit_dot_product_x = normal_vector_unit_dot_product * normal_vector_unit.x
                    const normal_vector_unit_dot_product_y = normal_vector_unit_dot_product * normal_vector_unit.y
                    const tangent_vector = new Vector(
                        this.x_speed - normal_vector_unit_dot_product_x,
                        this.y_speed - normal_vector_unit_dot_product_y
                    )
                    const tangent_vector_unit = tangent_vector.unit()
                    const tangent_vector_unit_dot_product = tangent_vector_unit.dot_product(velocity)

                    const tangent_vector_unit_dot_product_x = tangent_vector_unit_dot_product * tangent_vector_unit.x
                    const tangent_vector_unit_dot_product_y = tangent_vector_unit_dot_product * tangent_vector_unit.y
                    const normal_vector_unit_dot_product_x_new = -normal_vector_unit_dot_product_x
                    const normal_vector_unit_dot_product_y_new = -normal_vector_unit_dot_product_y

                    this.x_speed = normal_vector_unit_dot_product_x_new + tangent_vector_unit_dot_product_x
                    this.y_speed = normal_vector_unit_dot_product_y_new + tangent_vector_unit_dot_product_y
                    this.y_speed *= 0.99
                    this.x_speed *= 0.99
                }
            }
        }
    }

    add_debug_point = function (x, y, colour = 'red') {
        this.debug_points.push([x, y, colour])
    }

    draw_debug_point(x, y, colour = 'red') {
        // draw a line from the centre of the ball to the point
        ctx.strokeStyle = colour;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y)
        ctx.lineWidth = 2;
        ctx.lineTo(x, y)
        ctx.stroke();
    }
}

