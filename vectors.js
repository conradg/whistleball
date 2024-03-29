
class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    unit() {
        const length = this.length()
        if (length === 0) {
            return new Vector(0, 0)
        }
        return new Vector(this.x / length, this.y / length)
    }

    length() {
        return Math.sqrt(this.x ** 2 + this.y ** 2)
    }

    dot_product(vector) {
        return this.x * vector.x + this.y * vector.y
    }
}
