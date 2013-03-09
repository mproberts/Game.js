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
          'lib/game-object.js',
          'lib/engine.js',
          'lib/physics.js',
          'lib/controls.js',
          'lib/browser.js'
        ],
        dest: 'dist/<%= pkg.name %>-<%= pkg.version %>.js'
      }
    },

    watch: {
      scripts: {
        files: ['lib/**/*.js'],
        tasks: ['default'],
        options: {
          nospawn: true
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
