/**
 * Phaser 3 Isometric Plugin
 * Version: 1.0.0
 * License: MIT
 * Author: Sebashwa (original), updated by babzy955
 *
 * This file has been cleaned up and restructured as an ES6 module.
 * It converts the old UMD/minified code into a modern, readable format.
 *
 * Usage:
 *   In your game config, add:
 *
 *   plugins: {
 *     scene: [
 *       { key: 'IsoPlugin', plugin: IsoPlugin, mapping: 'iso' }
 *     ]
 *   }
 *
 *   Then inside your scenes, you can use:
 *     this.iso.createIsoSprite(x, y, z, texture, frame, origin);
 */

/* ======================================================
   IsoPoint
   A simple 3D point (or vector) with utility methods.
====================================================== */
export class IsoPoint {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    // Static vector math operations:
    static add(a, b, out = new IsoPoint()) {
        out.x = a.x + b.x;
        out.y = a.y + b.y;
        out.z = a.z + b.z;
        return out;
    }

    static subtract(a, b, out = new IsoPoint()) {
        out.x = a.x - b.x;
        out.y = a.y - b.y;
        out.z = a.z - b.z;
        return out;
    }

    static multiply(a, b, out = new IsoPoint()) {
        out.x = a.x * b.x;
        out.y = a.y * b.y;
        out.z = a.z * b.z;
        return out;
    }

    static divide(a, b, out = new IsoPoint()) {
        out.x = a.x / b.x;
        out.y = a.y / b.y;
        out.z = a.z / b.z;
        return out;
    }

    static equals(a, b) {
        return a.x === b.x && a.y === b.y && a.z === b.z;
    }

    copyFrom(point) {
        this.setTo(point.x, point.y, point.z);
        return this;
    }

    copyTo(point) {
        point.x = this.x;
        point.y = this.y;
        point.z = this.z;
        return point;
    }

    equals(point) {
        return IsoPoint.equals(this, point);
    }

    set(x, y, z) {
        this.x = x || 0;
        this.y = (y !== undefined) ? y : this.x;
        this.z = (z !== undefined) ? z : this.x;
        return this;
    }

    setTo(x, y, z) {
        return this.set(x, y, z);
    }

    add(dx, dy, dz) {
        this.x += dx || 0;
        this.y += dy || 0;
        this.z += dz || 0;
        return this;
    }

    subtract(dx, dy, dz) {
        this.x -= dx || 0;
        this.y -= dy || 0;
        this.z -= dz || 0;
        return this;
    }

    multiply(sx, sy, sz) {
        this.x *= sx || 1;
        this.y *= sy || 1;
        this.z *= sz || 1;
        return this;
    }

    divide(dx, dy, dz) {
        this.x /= dx || 1;
        this.y /= dy || 1;
        this.z /= dz || 1;
        return this;
    }
}

/* ======================================================
   IsoProjector
   Projects 3D isometric coordinates to 2D screen space.
====================================================== */
export class IsoProjector {
    constructor(scene, projectionAngle = Math.atan(0.5)) {
        this.scene = scene;
        this._projectionAngle = 0;
        this.projectionAngle = projectionAngle;
        this.origin = new Phaser.Geom.Point(0.5, 0.5);
    }

    get projectionAngle() {
        return this._projectionAngle;
    }

    set projectionAngle(angle) {
        if (angle !== this._projectionAngle) {
            this._projectionAngle = angle;
            this._transform = [Math.cos(angle), Math.sin(angle)];
        }
    }

    project(point, out = new Phaser.Geom.Point()) {
        // Basic isometric projection formula:
        out.x = (point.x - point.y) * this._transform[0];
        out.y = (point.x + point.y) * this._transform[1] - point.z;
        const config = this.scene.sys.game.config;
        out.x += config.width * this.origin.x;
        out.y += config.height * this.origin.y;
        return out;
    }

    unproject(point, out = new IsoPoint(), zOffset = 0) {
        const config = this.scene.sys.game.config;
        const x0 = point.x - config.width * this.origin.x;
        const y0 = point.y - config.height * this.origin.y + zOffset;
        out.x = x0 / (2 * this._transform[0]) + y0 / (2 * this._transform[1]);
        out.y = -x0 / (2 * this._transform[0]) + y0 / (2 * this._transform[1]);
        out.z = zOffset;
        return out;
    }
}

/* ======================================================
   IsoCube
   Represents a 3D cube (or rectangular prism) used for bounds and collisions.
====================================================== */
export class IsoCube {
    constructor(x = 0, y = 0, z = 0, widthX = 0, widthY = 0, height = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.widthX = widthX;
        this.widthY = widthY;
        this.height = height;
        // Pre-calculate the eight corners.
        this._corners = [
            new IsoPoint(x, y, z),
            new IsoPoint(x, y, z + height),
            new IsoPoint(x, y + widthY, z),
            new IsoPoint(x, y + widthY, z + height),
            new IsoPoint(x + widthX, y, z),
            new IsoPoint(x + widthX, y, z + height),
            new IsoPoint(x + widthX, y + widthY, z),
            new IsoPoint(x + widthX, y + widthY, z + height)
        ];
    }

    // Example: Check if a given point (x, y, z) is inside the cube.
    static contains(cube, x, y, z) {
        return (x >= cube.x && x <= cube.x + cube.widthX &&
                y >= cube.y && y <= cube.y + cube.widthY &&
                z >= cube.z && z <= cube.z + cube.height);
    }

    getCorners() {
        // Update corner positions before returning.
        this._corners[0].setTo(this.x, this.y, this.z);
        this._corners[1].setTo(this.x, this.y, this.z + this.height);
        this._corners[2].setTo(this.x, this.y + this.widthY, this.z);
        this._corners[3].setTo(this.x, this.y + this.widthY, this.z + this.height);
        this._corners[4].setTo(this.x + this.widthX, this.y, this.z);
        this._corners[5].setTo(this.x + this.widthX, this.y, this.z + this.height);
        this._corners[6].setTo(this.x + this.widthX, this.y + this.widthY, this.z);
        this._corners[7].setTo(this.x + this.widthX, this.y + this.widthY, this.z + this.height);
        return this._corners;
    }

    // Getters for additional properties:
    get frontX() { return this.x + this.widthX; }
    get frontY() { return this.y + this.widthY; }
    get top() { return this.z + this.height; }
    get volume() { return this.widthX * this.widthY * this.height; }
}

/* ======================================================
   IsoSprite
   A custom isometric sprite that extends Phaser.GameObjects.Sprite.
====================================================== */
export class IsoSprite extends Phaser.GameObjects.Sprite {
    constructor(scene, isoX, isoY, isoZ, texture, frame, origin = 0) {
        super(scene, 0, 0, texture, frame);
        this.type = "IsoSprite";
        this._isoPosition = new IsoPoint(isoX, isoY, isoZ);
        this.snap = 0;
        this._isoPositionChanged = true;
        this._isoBoundsChanged = true;
        this._project();
        this._isoBounds = this.resetIsoBounds();
    }

    get isoX() { return this._isoPosition.x; }
    set isoX(value) {
        this._isoPosition.x = value;
        this._isoPositionChanged = this._isoBoundsChanged = true;
        if (this.body) this.body._reset = true;
    }

    get isoY() { return this._isoPosition.y; }
    set isoY(value) {
        this._isoPosition.y = value;
        this._isoPositionChanged = this._isoBoundsChanged = true;
        if (this.body) this.body._reset = true;
    }

    get isoZ() { return this._isoPosition.z; }
    set isoZ(value) {
        this._isoPosition.z = value;
        this._isoPositionChanged = this._isoBoundsChanged = true;
        if (this.body) this.body._reset = true;
    }

    get isoPosition() {
        return this._isoPosition;
    }

    get isoBounds() {
        if (this._isoBoundsChanged) {
            this.resetIsoBounds();
            this._isoBoundsChanged = false;
        }
        return this._isoBounds;
    }

    _project() {
        if (this._isoPositionChanged) {
            // Use the scene’s iso plugin (assumed to be registered under a key in settings)
            const isoPluginKey = this.scene.sys.settings.map.isoPlugin;
            const projector = this.scene[isoPluginKey].projector;
            const proj = projector.project(this._isoPosition);
            this.x = proj.x;
            this.y = proj.y;
            // Use a simple depth calculation:
            this.depth = this._isoPosition.x + this._isoPosition.y + 1.25 * this._isoPosition.z;
            if (this.snap > 0) {
                this.x = Phaser.Math.snapTo(this.x, this.snap);
                this.y = Phaser.Math.snapTo(this.y, this.snap);
            }
            this._isoPositionChanged = this._isoBoundsChanged = true;
        }
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        this._project();
    }

    resetIsoBounds() {
        if (!this._isoBounds) {
            this._isoBounds = new IsoCube();
        }
        const tScale = Math.abs(this.scaleX);
        const iScale = Math.abs(this.scaleY);
        this._isoBounds.widthX = Math.round(0.5 * Math.abs(this.width)) * tScale;
        this._isoBounds.widthY = Math.round(0.5 * Math.abs(this.width)) * tScale;
        this._isoBounds.height = Math.round(Math.abs(this.height) - 0.5 * Math.abs(this.width)) * iScale;
        this._isoBounds.x = this.isoX + this._isoBounds.widthX * -this.originX + 0.5 * this._isoBounds.widthX;
        this._isoBounds.y = this.isoY + this._isoBounds.widthY * this.originX - 0.5 * this._isoBounds.widthY;
        this._isoBounds.z = this.isoZ - Math.abs(this.height) * (1 - this.originY) + Math.abs(0.5 * this.width);
        return this._isoBounds;
    }
}

/* ======================================================
   IsoPhysicsBody
   The physics body attached to an IsoSprite.
   (Note: Many detailed methods are omitted for brevity.)
====================================================== */
export class IsoPhysicsBody {
    constructor(sprite) {
        this.sprite = sprite;
        this.scene = sprite.scene;
        this.type = "IsoPhysics";
        this.enable = true;
        this.offset = new IsoPoint();
        this.position = new IsoPoint(sprite.isoX, sprite.isoY, sprite.isoZ);
        this.prev = new IsoPoint(this.position.x, this.position.y, this.position.z);
        this.allowRotation = true;
        this.rotation = sprite.angle;
        this.preRotation = sprite.angle;
        // Original dimensions
        this.sourceWidthX = sprite.width / sprite.scaleX;
        this.sourceWidthY = sprite.width / sprite.scaleX;
        this.sourceHeight = sprite.height / sprite.scaleY;
        this.widthX = Math.ceil(0.5 * sprite.width);
        this.widthY = Math.ceil(0.5 * sprite.width);
        this.height = sprite.height - Math.ceil(0.5 * sprite.width);
        this.halfWidthX = Math.abs(0.5 * this.widthX);
        this.halfWidthY = Math.abs(0.5 * this.widthY);
        this.halfHeight = Math.abs(0.5 * this.height);
        this.center = new IsoPoint(sprite.isoX + this.halfWidthX, sprite.isoY + this.halfWidthY, sprite.isoZ + this.halfHeight);
        this.velocity = new IsoPoint();
        this.newVelocity = new IsoPoint();
        this.deltaMax = new IsoPoint();
        this.acceleration = new IsoPoint();
        this.drag = new IsoPoint();
        this.allowGravity = true;
        this.gravity = new IsoPoint();
        this.bounce = new IsoPoint();
        this.maxVelocity = new IsoPoint(10000, 10000, 10000);
        this.angularVelocity = 0;
        this.angularAcceleration = 0;
        this.angularDrag = 0;
        this.maxAngular = 1000;
        this.mass = 1;
        this.angle = 0;
        this.speed = 0;
        this.facing = Phaser.NONE;
        this.immovable = false;
        this.moves = true;
        this.customSeparateX = false;
        this.customSeparateY = false;
        this.customSeparateZ = false;
        this.overlapX = 0;
        this.overlapY = 0;
        this.overlapZ = 0;
        this.embedded = false;
        this.collideWorldBounds = false;
        this.checkCollision = { none: false, any: true, up: true, down: true, frontX: true, frontY: true, backX: true, backY: true };
        this.touching = { none: true, up: false, down: false, frontX: false, frontY: false, backX: false, backY: false };
        this.wasTouching = { none: true, up: false, down: false, frontX: false, frontY: false, backX: false, backY: false };
        this.blocked = { up: false, down: false, frontX: false, frontY: false, backX: false, backY: false };
        this.phase = 0;
        this.skipTree = false;
        this._reset = true;
        this._sx = sprite.scaleX;
        this._sy = sprite.scaleY;
        this._dx = 0;
        this._dy = 0;
        this._dz = 0;
        // Pre-calculate corners for collision purposes:
        this._corners = [
            new IsoPoint(this.position.x, this.position.y, this.position.z),
            new IsoPoint(this.position.x, this.position.y, this.position.z + this.height),
            new IsoPoint(this.position.x, this.position.y + this.widthY, this.position.z),
            new IsoPoint(this.position.x, this.position.y + this.widthY, this.position.z + this.height),
            new IsoPoint(this.position.x + this.widthX, this.position.y, this.position.z),
            new IsoPoint(this.position.x + this.widthX, this.position.y, this.position.z + this.height),
            new IsoPoint(this.position.x + this.widthX, this.position.y + this.widthY, this.position.z),
            new IsoPoint(this.position.x + this.widthX, this.position.y + this.widthY, this.position.z + this.height)
        ];
    }

    update(delta) {
        // Update motion, collisions, etc.
    }

    postUpdate() {
        // Update post-motion corrections.
    }

    checkWorldBounds() {
        // Implement collision with world bounds.
    }

    // Additional methods for delta calculations, hit testing, etc.
}

/* ======================================================
   Octree (Placeholder)
   Used for spatial partitioning to speed up collision checks.
====================================================== */
export class Octree {
    constructor(x, y, z, widthX, widthY, height, maxObjects = 10, maxLevels = 4, level = 0) {
        this.maxObjects = maxObjects;
        this.maxLevels = maxLevels;
        this.level = level;
        this.bounds = { x: Math.round(x), y: Math.round(y), z: Math.round(z), widthX, widthY, height };
        this.objects = [];
        this.nodes = [];
    }

    reset(x, y, z, widthX, widthY, height, maxObjects, maxLevels, level) {
        this.bounds = { x: Math.round(x), y: Math.round(y), z: Math.round(z), widthX, widthY, height };
        this.objects.length = 0;
        this.nodes.length = 0;
    }

    split() {
        // Split this octree node into eight children.
    }

    insert(object) {
        // Insert an object into the octree.
    }

    retrieve(object) {
        // Retrieve potential collision candidates.
        return [];
    }

    clear() {
        this.objects.length = 0;
        this.nodes.forEach(node => node.clear());
        this.nodes.length = 0;
    }
}

/* ======================================================
   IsoPhysicsManager
   Handles physics updates and collisions for isometric bodies.
====================================================== */
export class IsoPhysicsManager {
    constructor(scene) {
        this.scene = scene;
        this.bodies = new Phaser.Structs.Set();
        const config = scene.sys.game.config;
        this.bounds = new IsoCube(0, 0, 0, 0.5 * config.width, 0.5 * config.width, config.height);
        this.gravity = new IsoPoint();
        this.checkCollision = { up: true, down: true, frontX: true, frontY: true, backX: true, backY: true };
        this.OVERLAP_BIAS = 4;
        this.forceXY = false;
        this.skipTree = false;
        this.maxObjects = 10;
        this.maxLevels = 4;
        this.octree = new Octree(
            this.bounds.x,
            this.bounds.y,
            this.bounds.z,
            this.bounds.widthX,
            this.bounds.widthY,
            this.bounds.height,
            this.maxObjects,
            this.maxLevels
        );
    }

    enableBody(sprite) {
        if (!sprite.body) {
            sprite.body = new IsoPhysicsBody(sprite);
            this.bodies.set(sprite.body);
        }
        return sprite;
    }

    update(delta) {
        this.bodies.entries.forEach(body => {
            if (body.enable) {
                body.update(delta);
            }
        });
    }

    postUpdate() {
        this.bodies.entries.forEach(body => {
            if (body.enable) {
                body.postUpdate();
            }
        });
    }

    // Collision methods would be implemented here.
}

/* ======================================================
   IsoPlugin (Main Plugin Class)
   Extends Phaser.Plugins.ScenePlugin so it hooks into the scene.
====================================================== */
export default class IsoPlugin extends Phaser.Plugins.ScenePlugin {
    constructor(scene, pluginManager) {
        super(scene, pluginManager);
        this.scene = scene;
        this.systems = scene.sys;
        // Initialize the projector for converting 3D isometric coordinates.
        this.projector = new IsoProjector(scene, scene.settings.isometricType);
        // Register custom game objects for isometric sprites.
        scene.sys.displayList.addFactory('isoSprite', (x, y, z, texture, frame, origin = 0) => {
            const sprite = new IsoSprite(this.scene, x, y, z, texture, frame, origin);
            this.scene.add.existing(sprite);
            return sprite;
        });
        scene.sys.displayList.addCreator('isoSprite', (config) => {
            const sprite = new IsoSprite(this.scene, config.x, config.y, config.z, config.key, config.frame, config.origin);
            return sprite;
        });
    }

    boot() {
        // Called when the scene boots.
        this.scene.sys.events.once('shutdown', this.shutdown, this);
    }

    shutdown() {
        // Clean up any references.
        this.scene = null;
    }

    // Example helper method:
    createIsoSprite(x, y, z, texture, frame, origin = 0) {
        return this.scene.add.isoSprite(x, y, z, texture, frame, origin);
    }

    // Additional methods to integrate isometric physics, collisions, etc., can be added here.
}

/* ======================================================
   End of IsoPlugin.js
====================================================== */
