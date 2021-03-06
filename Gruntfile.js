module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    vows: {
        all: {
          options: {
            reporter: "spec",
            verbose: false,
            silent: false,
            colors: true,
            isolate: false,
            coverage: "json"
          },
          src: ["test/*.js"]
        }
    },

    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: [
          'lib/utils.js',
          'lib/timers.js',
          'lib/easing.js',
          'lib/resources.js',
          'lib/game-object.js',
          'lib/physics.js',
          'lib/controls.js',
          'lib/button.js',
          'lib/sprites.js',
          'lib/text.js',
          'lib/collisions.js',
          'lib/scenes.js',
          'lib/scroller.js',
          'lib/engine.js',
          'lib/default-behaviours.js'
        ],
        dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.js'
      }
    },

    watch: {
      scripts: {
        files: ['lib/**/*.js'],
        tasks: ['default'],
        options: {
          nospawn: false
        }
      }
    },

    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>-<%= pkg.version %>.min.js': ['<%= concat.dist.dest %>']
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-vows");
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('test', ['vows']);

  grunt.registerTask('default', ['vows', 'concat', 'uglify']);
};
